const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req,res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({message:'email and password required'});
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({message:'email already exists'});
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
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
    
    let message = 'Registered successfully';
    if (role === 'wholesaler') message = 'Registered as wholesaler – awaiting admin approval';
    if (role === 'retailer') message = 'Registered as retailer – awaiting admin approval';
    
    res.status(201).json({ message });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({message:'server error', error: err.message})
  }
};

exports.login = async (req,res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(400).json({ message: 'Invalid credentials' });
    
    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Check if wholesaler/retailer is approved
    if (u.role === 'wholesaler' && !u.wholesalerInfo?.approved) {
      return res.status(403).json({ message: 'Your wholesaler account is pending approval' });
    }
    if (u.role === 'retailer' && !u.retailerInfo?.approved) {
      return res.status(403).json({ message: 'Your retailer account is pending approval' });
    }
    
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: u._id, 
        email: u.email, 
        role: u.role, 
        name: u.name,
        approved: u.role === 'wholesaler' ? u.wholesalerInfo?.approved : 
                  u.role === 'retailer' ? u.retailerInfo?.approved : true
      }
    });
  } catch (err) { 
    res.status(500).json({message:'server error'})
  }
};