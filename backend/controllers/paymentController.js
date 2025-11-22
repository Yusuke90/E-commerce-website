const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const emailService = require('../services/emailService');
const User = require('../models/userModel');

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const options = {
      amount: Math.round(normalizedAmount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order' 
    });
  }
};

// ✅ ENHANCED: Auto-add B2B purchases to retailer inventory
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId
    } = req.body;

    console.log('Payment verification started for order:', orderId);

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature === razorpay_signature) {
      console.log('Payment signature verified successfully');
      
      // Payment verified! Update order
      const order = await Order.findById(orderId).populate('items.product');
      
      if (!order) {
        console.error('Order not found:', orderId);
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }

      // Get customer details
      const customer = await User.findById(order.customer).select('name email role');
      
      if (!customer) {
        console.error('Customer not found:', order.customer);
        return res.status(404).json({ 
          success: false, 
          message: 'Customer not found' 
        });
      }

      order.paymentStatus = 'completed';
      order.paymentId = razorpay_payment_id;
      order.status = 'confirmed';
      await order.save();

      console.log('Order updated successfully');

      // ✅ NEW: If this is a B2B order (retailer buying from wholesaler), add to inventory
      if (order.orderType === 'B2B' && customer.role === 'retailer') {
        console.log('B2B order detected. Adding products to retailer inventory...');
        
        const addedProducts = [];
        
        for (const item of order.items) {
          const wholesalerProduct = item.product;
          
          if (!wholesalerProduct) {
            console.warn(`Product ${item.product} not found, skipping`);
            continue;
          }

          // Check if retailer already has this product
          const existingProduct = await Product.findOne({
            owner: customer._id,
            sourceWholesaler: wholesalerProduct.owner,
            name: wholesalerProduct.name
          });

          if (existingProduct) {
            // Update stock
            existingProduct.stock += item.quantity;
            await existingProduct.save();
            console.log(`Updated existing product: ${existingProduct.name} (added ${item.quantity} units)`);
            addedProducts.push({ ...existingProduct.toObject(), added: item.quantity });
          } else {
            // Create new product for retailer
            const retailPrice = item.pricePerUnit * 1.3; // 30% markup by default
            
            const newProduct = new Product({
              name: wholesalerProduct.name,
              description: wholesalerProduct.description,
              category: wholesalerProduct.category,
              retailPrice: retailPrice,
              stock: item.quantity,
              owner: customer._id,
              ownerType: 'retailer',
              sourceWholesaler: wholesalerProduct.owner,
              wholesaleEnabled: false,
              isLocalProduct: wholesalerProduct.isLocalProduct,
              region: wholesalerProduct.region,
              images: wholesalerProduct.images
            });

            await newProduct.save();
            console.log(`Created new product: ${newProduct.name} with ${item.quantity} units`);
            addedProducts.push({ ...newProduct.toObject(), added: item.quantity });
          }
        }

        console.log(`✅ Added ${addedProducts.length} products to retailer inventory`);
      }

      // Send emails
      try {
        await emailService.sendOrderConfirmation(order, customer);
        console.log('✅ Order confirmation email sent to:', customer.email);
      } catch (emailError) {
        console.error('❌ Order confirmation email error:', emailError);
      }
      
      try {
        await emailService.sendNewOrderToSellers(order);
        console.log('✅ Seller notification emails sent');
      } catch (emailError) {
        console.error('❌ Seller notification email error:', emailError);
      }

      res.json({
        success: true,
        message: order.orderType === 'B2B' ? 
          'Payment verified successfully. Products added to your inventory!' : 
          'Payment verified successfully',
        order
      });
    } else {
      console.error('Payment signature verification failed');
      res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification error',
      error: error.message
    });
  }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment details' 
    });
  }
};