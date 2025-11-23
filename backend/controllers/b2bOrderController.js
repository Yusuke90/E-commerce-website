const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const pickWholesalePrice = require('../utils/pickWholesalePrice');

// Retailer places B2B order with wholesaler
exports.createB2BOrder = async (req, res) => {
  try {
    const { items, paymentMethod, deliveryAddress, customerNotes } = req.body;
    // items: [{ productId, quantity }]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order items required' });
    }

    if (!paymentMethod || !deliveryAddress) {
      return res.status(400).json({ message: 'Payment method and delivery address required' });
    }

    // Validate and calculate order
    const orderItems = [];
    let subtotal = 0;
    const wholesalerOrders = {}; // Group by wholesaler

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      if (product.ownerType !== 'wholesaler') {
        return res.status(400).json({ message: 'Can only order from wholesalers in B2B' });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available` 
        });
      }

      // Check minimum order quantity
      if (item.quantity < product.wholesaleMinQty) {
        return res.status(400).json({ 
          message: `Minimum order quantity for ${product.name} is ${product.wholesaleMinQty}` 
        });
      }

      // Calculate wholesale price
      const pricePerUnit = pickWholesalePrice(product, item.quantity);
      const totalPrice = pricePerUnit * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        pricePerUnit,
        totalPrice,
        seller: product.owner,
        sellerType: 'wholesaler'
      });
    }

    // Calculate totals
    const tax = subtotal * 0.18; // 18% GST for B2B
    const deliveryFee = subtotal > 10000 ? 0 : 500; // Free delivery above 10k
    const totalAmount = subtotal + tax + deliveryFee;

    // Create B2B order
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
      orderType: 'B2B',
      status: paymentMethod === 'online' ? 'pending' : 'confirmed',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for B2B
    });

    await order.save();

    // ✅ BUG FIX: Use transaction to prevent race conditions in stock deduction
    // For online payments, stock will be deducted after payment verification
    if (paymentMethod !== 'online') {
      const session = await Order.db.startSession();
      try {
        await session.withTransaction(async () => {
          // Re-check stock and minimum quantity within transaction
          for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
              throw new Error(`Product ${item.productId} not found`);
            }
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available`);
            }
            if (item.quantity < product.wholesaleMinQty) {
              throw new Error(`Minimum order quantity for ${product.name} is ${product.wholesaleMinQty}`);
            }
            product.stock -= item.quantity;
            await product.save({ session });
          }
        });
      } catch (err) {
        // If transaction fails, delete the order
        await Order.findByIdAndDelete(order._id);
        return res.status(400).json({ 
          message: err.message || 'Failed to process B2B order due to stock unavailability' 
        });
      } finally {
        await session.endSession();
      }
    }

    res.status(201).json({ 
      message: 'B2B order placed successfully', 
      order,
      orderId: order._id
    });
  } catch (err) {
    console.error('B2B order error:', err);
    if (err.message.includes('stock') || err.message.includes('Stock') || err.message.includes('quantity')) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ 
        message: 'Failed to create B2B order. Please try again or contact support if the problem persists.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

// Get retailer's B2B orders (orders placed with wholesalers)
exports.getMyB2BOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      customer: req.user._id,
      orderType: 'B2B'
    })
      .populate('items.product', 'name images')
      .populate('items.seller', 'name email wholesalerInfo.companyName')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching B2B orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch B2B orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get wholesaler's B2B orders (orders received from retailers)
exports.getWholesalerB2BOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      'items.seller': req.user._id,
      orderType: 'B2B'
    })
      .populate('customer', 'name email retailerInfo.shopName')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    // Filter items to only show this wholesaler's items
    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        item => item.seller.toString() === req.user._id.toString()
      );
      return orderObj;
    });

    res.json(filteredOrders);
  } catch (err) {
    console.error('Error fetching B2B orders:', err);
    res.status(500).json({ 
      message: 'Failed to fetch B2B orders. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};