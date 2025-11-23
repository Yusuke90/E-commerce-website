console.log('Order controller loading...');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const pickWholesalePrice = require('../utils/pickWholesalePrice');
const emailService = require('../services/emailService');

// Create order from cart 
exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod, deliveryAddress, customerNotes } = req.body;
    
    if (!paymentMethod || !deliveryAddress) {
      return res.status(400).json({ message: 'Payment method and delivery address required' });
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Validate stock and prepare order items
    const orderItems = [];
    let subtotal = 0;
    
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      // Check if product exists
      if (!product) {
        return res.status(400).json({ message: 'Some products in cart no longer exist' });
      }
      
      // Check stock
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available` 
        });
      }
      
      // Calculate price
      let pricePerUnit;
      if (product.ownerType === 'wholesaler' && req.user.role === 'retailer') {
        pricePerUnit = pickWholesalePrice(product, cartItem.quantity);
      } else {
        pricePerUnit = product.retailPrice;
      }
      
      const totalPrice = pricePerUnit * cartItem.quantity;
      subtotal += totalPrice;
      
      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: cartItem.quantity,
        pricePerUnit,
        totalPrice,
        seller: product.owner,
        sellerType: product.ownerType
      });
    }
    
    // Calculate totals
    const tax = subtotal * 0.05; // 5% tax
    const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery above 500
    const totalAmount = subtotal + tax + deliveryFee;
    
    // Determine order type
    const orderType = req.user.role === 'retailer' ? 'B2B' : 'B2C';
    
    // Create order
    const order = new Order({
      customer: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      deliveryFee,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      customerNotes,
      orderType,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
    });
    
    await order.save();
    
    // ✅ BUG FIX: Use transaction to prevent race conditions in stock deduction
    // For online payments, stock will be deducted after payment verification
    if (paymentMethod !== 'online') {
      const session = await Cart.db.startSession();
      try {
        await session.withTransaction(async () => {
          // Re-check stock within transaction to prevent race conditions
          for (const cartItem of cart.items) {
            const product = await Product.findById(cartItem.product._id).session(session);
            if (!product) {
              throw new Error(`Product ${cartItem.product._id} not found`);
            }
            if (product.stock < cartItem.quantity) {
              throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available`);
            }
            product.stock -= cartItem.quantity;
            await product.save({ session });
          }
        });
      } catch (err) {
        // If transaction fails, delete the order
        await Order.findByIdAndDelete(order._id);
        return res.status(400).json({ 
          message: err.message || 'Failed to process order due to stock unavailability' 
        });
      } finally {
        await session.endSession();
      }
    }
    
    // Clear cart
    cart.items = [];
    await cart.save();
    
    res.status(201).json({ 
      message: 'Order placed successfully', 
      order,
      orderId: order._id
    });
  } catch (err) {
    console.error('Order creation error:', err);
    if (err.message.includes('stock') || err.message.includes('Stock')) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ 
        message: 'Failed to create order. Please try again or contact support if the problem persists.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

// Get user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'name images')
      .populate('items.seller', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get single order details
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product', 'name description images')
      .populate('items.seller', 'name email retailerInfo.shopName wholesalerInfo.companyName');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user has access to this order
    if (order.customer._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' &&
        !order.items.some(item => item.seller.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get orders for seller (retailer/wholesaler)
exports.getSellerOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = { 'items.seller': req.user._id };
    if (status) filter.status = status;
    
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    
    // Filter items to only show this seller's items
    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        item => item.seller.toString() === req.user._id.toString()
      );
      return orderObj;
    });
    
    res.json(filteredOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update order status (seller/admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check permissions
    const isSeller = order.items.some(item => item.seller.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isSeller) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // ✅ FIX: Save old status before updating
    const oldStatus = order.status;
    
    order.status = status;
    
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'completed';
    }
    
    if (status === 'cancelled') {
      // ✅ FIX: Only restore stock if order was not already cancelled
      // and if stock was actually deducted (i.e., payment was completed or was cash payment)
      if (oldStatus !== 'cancelled' && 
          (order.paymentStatus === 'completed' || order.paymentMethod !== 'online')) {
        // Restore stock
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      }
    }
    
    await order.save();

    await emailService.sendOrderStatusUpdate(order, order.customer, status).catch(err =>
    console.error('Status update email error:', err)
    );
    
    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Cancel order (customer)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel order that is already shipped or delivered' });
    }
    
    // ✅ FIX: Only restore stock if it was already deducted
    // (i.e., payment was completed or was cash/offline payment)
    if (order.status !== 'cancelled' && 
        (order.paymentStatus === 'completed' || order.paymentMethod !== 'online')) {
      // Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get order statistics (for seller dashboard)
exports.getOrderStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    const stats = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      }
    ]);
    
    const totalOrders = await Order.countDocuments({ 'items.seller': sellerId });
    
    res.json({ stats, totalOrders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};