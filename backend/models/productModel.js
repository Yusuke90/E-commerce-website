const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WholesaleTierSchema = new Schema({
  minQty: Number,
  pricePerUnit: Number
});

const productSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  category: String, // e.g., 'Electronics', 'Groceries', 'Clothing'
  images: [String],
  
  // Price and stock for retail customers (B2C)
  retailPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  
  // Who owns this product
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ownerType: { type: String, enum: ['retailer', 'wholesaler'], required: true },
  
  // Wholesale pricing (for B2B - retailer buying from wholesaler)
  wholesaleEnabled: { type: Boolean, default: false },
  wholesaleMinQty: { type: Number, default: 0 },
  wholesalePrice: Number,
  wholesaleTiers: [WholesaleTierSchema],
  
  // For retailer products: reference to wholesaler source (if applicable)
  sourceWholesaler: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Region/local product flag
  isLocalProduct: { type: Boolean, default: false },
  region: String,
  
  averageRating: { type: Number, default: 0 },
  numberOfReviews: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ retailPrice: 1 });
productSchema.index({ owner: 1, ownerType: 1 });

module.exports = mongoose.model('Product', productSchema);