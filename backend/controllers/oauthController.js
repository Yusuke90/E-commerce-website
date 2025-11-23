const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const emailService = require('../services/emailService');

// Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    // Exchange code for access token
    let tokenResponse;
    try {
      tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      });
    } catch (error) {
      console.error('Google token exchange error:', error.response?.data || error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    // Get user info from Google
    let userInfoResponse;
    try {
      userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
    } catch (error) {
      console.error('Google user info error:', error.response?.data || error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    const { id, email, name, picture } = userInfoResponse.data;
    
    if (!id) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    // Validate email (required)
    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=email_required`);
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { oauthProvider: 'google', oauthId: id.toString() }
      ]
    });

    if (user) {
      // Existing user - login or link account
      if (!user.oauthProvider || user.oauthProvider !== 'google') {
        // Link OAuth account to existing user
        user.oauthProvider = 'google';
        user.oauthId = id.toString();
        if (picture) user.profilePicture = picture;
        if (!user.name && name) user.name = name;
        await user.save();
      } else if (user.oauthProvider === 'google' && user.oauthId !== id.toString()) {
        // OAuth ID mismatch - potential security issue
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_mismatch`);
      }
      // Update profile picture if available
      if (picture && (!user.profilePicture || user.profilePicture !== picture)) {
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // New user - registration
      user = new User({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        oauthProvider: 'google',
        oauthId: id.toString(),
        profilePicture: picture || null,
        role: 'customer' // OAuth users default to customer
      });
      await user.save();

      // Send welcome email
      emailService.sendWelcomeEmail(user).catch(err =>
        console.error('Welcome email error:', err)
      );
    }

    // Check if retailer/wholesaler is approved
    if (user.role === 'wholesaler' && !user.wholesalerInfo?.approved) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=account_pending`);
    }
    if (user.role === 'retailer' && !user.retailerInfo?.approved) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=account_pending`);
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      approved: user.role === 'wholesaler' ? user.wholesalerInfo?.approved :
                user.role === 'retailer' ? user.retailerInfo?.approved : true
    }))}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
  }
};

// Get OAuth URLs
exports.getGoogleAuthUrl = (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.BACKEND_URL || 'http://localhost:5000')}/api/auth/google/callback&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.json({ authUrl });
};

