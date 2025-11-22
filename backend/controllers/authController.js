const User = require('../models/userModel');
const OTP = require('../models/otpModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for registration
exports.sendRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      // Check if user is OAuth user
      if (existing.oauthProvider) {
        return res.status(400).json({ 
          message: `Email already registered with ${existing.oauthProvider}. Please use OAuth login.` 
        });
      }
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing OTPs for this email and purpose
    await OTP.deleteMany({ email: normalizedEmail, purpose: 'registration' });

    // Save new OTP
    const otpRecord = new OTP({
      email: normalizedEmail,
      otp,
      purpose: 'registration',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await otpRecord.save();

    // Send OTP email
    await emailService.sendOTPEmail(normalizedEmail, otp, 'registration').catch(err =>
      console.error('OTP email error:', err)
    );

    res.json({ 
      message: 'OTP sent to your email. Please check your inbox.',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error', error: err.message });
  }
};

// Verify OTP and complete registration
exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp, name, password, role } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and password required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      otp: otp.trim(),
      purpose: 'registration',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new OTP.' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Check if user already exists (race condition check)
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.oauthProvider) {
        return res.status(400).json({ 
          message: `Email already registered with ${existing.oauthProvider}. Please use OAuth login.` 
        });
      }
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password: hashed,
      role: role || 'customer'
    });

    // If role is wholesaler
    if (role === 'wholesaler') {
      user.wholesalerInfo = {
        companyName: req.body.companyName,
        gstNumber: req.body.gstNumber,
        address: req.body.address,
        phone: req.body.phone,
        minOrderQty: req.body.minOrderQty || 1,
        approved: false
      };
    }

    // If role is retailer
    if (role === 'retailer') {
      user.retailerInfo = {
        shopName: req.body.shopName,
        gstNumber: req.body.gstNumber,
        address: req.body.address,
        phone: req.body.phone,
        location: req.body.location ? {
          type: 'Point',
          coordinates: [req.body.location.longitude, req.body.location.latitude]
        } : undefined,
        approved: false
      };
    }

    await user.save();

    // Send welcome email
    emailService.sendWelcomeEmail(user).catch(err =>
      console.error('Welcome email error:', err)
    );

    // For customers, automatically log them in by returning token
    if (role === 'customer' || !role) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      res.status(201).json({
        message: 'Registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          approved: true
        },
        autoLogin: true
      });
    } else {
      // For retailer/wholesaler, they need admin approval
      let message = 'Registered as wholesaler – awaiting admin approval';
      if (role === 'retailer') message = 'Registered as retailer – awaiting admin approval';
      
      res.status(201).json({
        message,
        autoLogin: false
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error', error: err.message });
  }
};

// Send OTP for login
exports.sendLoginOTP = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify credentials first
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is OAuth-only user (no password)
    if (user.oauthProvider && !user.password) {
      return res.status(400).json({ 
        message: `This account was created with ${user.oauthProvider}. Please use OAuth login.` 
      });
    }

    // Check if password exists
    if (!user.password) {
      return res.status(400).json({ 
        message: 'Password not set. Please use OAuth login or reset your password.' 
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if wholesaler/retailer is approved
    if (user.role === 'wholesaler' && !user.wholesalerInfo?.approved) {
      return res.status(403).json({ message: 'Your wholesaler account is pending approval' });
    }
    if (user.role === 'retailer' && !user.retailerInfo?.approved) {
      return res.status(403).json({ message: 'Your retailer account is pending approval' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing OTPs for this email and purpose
    await OTP.deleteMany({ email: normalizedEmail, purpose: 'login' });

    // Save new OTP
    const otpRecord = new OTP({
      email: normalizedEmail,
      otp,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await otpRecord.save();

    // Send OTP email
    await emailService.sendOTPEmail(normalizedEmail, otp, 'login').catch(err =>
      console.error('OTP email error:', err)
    );

    res.json({
      message: 'OTP sent to your email. Please check your inbox.',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error', error: err.message });
  }
};

// Verify OTP and complete login
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      otp: otp.trim(),
      purpose: 'login',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new OTP.' });
    }

    // Get user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        approved: user.role === 'wholesaler' ? user.wholesalerInfo?.approved :
          user.role === 'retailer' ? user.retailerInfo?.approved : true
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error', error: err.message });
  }
};