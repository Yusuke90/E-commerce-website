const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  quantity: { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  // Track if this is from retailer or wholesaler
  seller: { type: Schema.Types.ObjectId, ref: 'User' },
  sellerType: { type: String, enum: ['retailer', 'wholesaler'] }
});

const orderSchema = new Schema({
  // Who placed the order
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Order items
  items: [OrderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'card', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String, // Transaction ID from payment gateway
  
  // Delivery information
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    landmark: String
  },
  
  // Tracking
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  
  // Notes
  customerNotes: String,
  adminNotes: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Order type (B2C or B2B)
  orderType: {
    type: String,
    enum: ['B2C', 'B2B'],
    default: 'B2C'
  }
});

// Indexes for faster queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.seller': 1 });

// Calculate total before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('subtotal')) {
    this.totalAmount = this.subtotal + this.tax + this.deliveryFee - this.discount;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);