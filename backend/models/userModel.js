const mongoose = require('mongoose');

const WholesalerInfoSchema = new mongoose.Schema({
  companyName: String,
  gstNumber: String,
  address: String,
  phone: String,
  minOrderQty: { type: Number, default: 1 },
  wholesaleTiers: [
    { minQty: Number, discountPercent: Number }
  ],
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const RetailerInfoSchema = new mongoose.Schema({
  shopName: String,
  gstNumber: String,
  address: String,
  phone: String,
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number] // [longitude, latitude]
  },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String }, // Optional for OAuth users
  role: { type: String, enum: ['customer','retailer','wholesaler','admin'], default: 'customer' },
  // OAuth fields
  oauthProvider: { type: String, enum: ['google', 'facebook'], default: null },
  oauthId: { type: String, default: null }, // OAuth provider user ID
  profilePicture: { type: String, default: null }, // Profile picture URL from OAuth
  wholesalerInfo: WholesalerInfoSchema,
  retailerInfo: RetailerInfoSchema,
  createdAt: { type: Date, default: Date.now }
});

// Index for OAuth lookup
userSchema.index({ oauthProvider: 1, oauthId: 1 });

// Only create geospatial index if location exists and is valid
// We'll add this later when we have proper location data
// userSchema.index({ 'retailerInfo.location': '2dsphere' });

module.exports = mongoose.model('User', userSchema);