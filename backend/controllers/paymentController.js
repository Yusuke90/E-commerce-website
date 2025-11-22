const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const Order = require('../models/orderModel');
const emailService = require('../services/emailService');
const User = require('../models/userModel');

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const options = {
      amount: Math.round(normalizedAmount * 100), // Razorpay expects amount in paise
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

// Verify Razorpay payment
// Verify Razorpay payment
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
      const order = await Order.findById(orderId);
      
      if (!order) {
        console.error('Order not found:', orderId);
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }

      // Get customer details separately
      const customer = await User.findById(order.customer).select('name email');
      
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

      console.log('Order updated successfully. Sending emails...');

      // ✅ Send emails after successful payment
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
        message: 'Payment verified successfully',
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