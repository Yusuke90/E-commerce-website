const User = require('../models/userModel');

// List pending wholesalers
exports.listPendingWholesalers = async (req,res) => {
  try {
    const pending = await User.find({ 
      role:'wholesaler', 
      'wholesalerInfo.approved': false 
    }).select('-password');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

// Approve wholesaler
exports.approveWholesaler = async (req,res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndUpdate(
      id, 
      { 'wholesalerInfo.approved': true }, 
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message:'Wholesaler not found' });
    res.json({ message:'Wholesaler approved', user });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

// List pending retailers
exports.listPendingRetailers = async (req,res) => {
  try {
    const pending = await User.find({ 
      role:'retailer', 
      'retailerInfo.approved': false 
    }).select('-password');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

// Approve retailer
exports.approveRetailer = async (req,res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndUpdate(
      id, 
      { 'retailerInfo.approved': true }, 
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message:'Retailer not found' });
    res.json({ message:'Retailer approved', user });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};