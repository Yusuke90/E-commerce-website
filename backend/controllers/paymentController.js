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
      
      // ✅ BUG FIX: Deduct stock for online payments after payment verification with transaction
      if (order.paymentMethod === 'online') {
        const insufficientStockItems = [];
        const session = await Order.db.startSession();
        let transactionFailed = false;
        
        try {
          await session.withTransaction(async () => {
            for (const item of order.items) {
              // item.product is already populated, but we need to get fresh data for stock update
              const productId = item.product._id || item.product;
              const product = await Product.findById(productId).session(session);
              if (product) {
                // Double-check stock availability before deducting (within transaction)
                if (product.stock >= item.quantity) {
                  product.stock -= item.quantity;
                  await product.save({ session });
                  console.log(`Deducted ${item.quantity} units from product ${product.name} (Stock: ${product.stock})`);
                } else {
                  console.error(`Insufficient stock for product ${product.name} (ID: ${product._id}). Available: ${product.stock}, Required: ${item.quantity}`);
                  insufficientStockItems.push({ product: product.name, available: product.stock, required: item.quantity });
                  throw new Error(`Insufficient stock for ${product.name}`);
                }
              } else {
                console.error(`Product not found for item: ${item.productId || item.product}`);
                insufficientStockItems.push({ product: 'Unknown', available: 0, required: item.quantity });
                throw new Error(`Product not found`);
              }
            }
          });
        } catch (transactionError) {
          // Transaction will automatically rollback
          transactionFailed = true;
          console.error('Transaction failed:', transactionError.message);
        } finally {
          await session.endSession();
        }
        
        // ✅ BUG FIX: If transaction failed due to insufficient stock, refund payment
        if (transactionFailed && insufficientStockItems.length > 0) {
          console.error('Insufficient stock detected. Initiating refund...');
          
          try {
            // Refund the payment
            const refund = await razorpay.payments.refund(razorpay_payment_id, {
              amount: order.totalAmount * 100, // Amount in paise
              speed: 'normal',
              notes: {
                reason: 'Insufficient stock',
                orderId: order._id.toString(),
                items: insufficientStockItems.map(i => i.product).join(', ')
              }
            });
            
            console.log('Refund initiated successfully:', refund.id);
            
            // Update order status
            order.paymentStatus = 'refunded';
            order.status = 'cancelled';
            await order.save();
            
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for some items. Payment of ₹${order.totalAmount} has been refunded. Refund ID: ${refund.id}`,
              refundId: refund.id,
              orderId: order._id,
              insufficientItems: insufficientStockItems
            });
          } catch (refundError) {
            console.error('Refund error:', refundError);
            // Even if refund fails, don't confirm the order
            order.paymentStatus = 'failed';
            order.status = 'cancelled';
            await order.save();
            
            return res.status(500).json({
              success: false,
              message: `Insufficient stock detected. Payment verification failed. Please contact support for refund. Order ID: ${order._id}`,
              orderId: order._id,
              insufficientItems: insufficientStockItems,
              refundError: refundError.message
            });
          }
        }
      }
      
      await order.save();

      console.log('Order updated successfully');

      // ✅ NEW: If this is a B2B order (retailer buying from wholesaler), add to inventory
      if (order.orderType === 'B2B' && customer.role === 'retailer') {
        console.log('B2B order detected. Adding products to retailer inventory...');
        
        const addedProducts = [];
        
        for (const item of order.items) {
          // ✅ FIX: Handle both populated and non-populated product references
          const productId = item.product?._id || item.product;
          let wholesalerProduct = item.product?._id ? item.product : null;
          
          // If not populated or missing owner, fetch the product
          if (!wholesalerProduct || !wholesalerProduct.owner) {
            wholesalerProduct = await Product.findById(productId);
            if (!wholesalerProduct) {
              console.warn(`Product ${productId} not found, skipping`);
              continue;
            }
          }
          
          // Get wholesaler owner ID (handle both populated and non-populated)
          const wholesalerOwnerId = wholesalerProduct.owner?._id || wholesalerProduct.owner;

          // Check if retailer already has this product
          const existingProduct = await Product.findOne({
            owner: customer._id,
            sourceWholesaler: wholesalerOwnerId,
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
              sourceWholesaler: wholesalerOwnerId, // ✅ FIX: Use the extracted owner ID
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
      
      // ✅ BUG FIX: If signature verification fails, mark order as failed and don't deduct stock
      const order = await Order.findById(req.body.orderId);
      if (order && order.paymentMethod === 'online') {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();
        
        // Send notification email to customer about payment failure
        try {
          const customer = await User.findById(order.customer).select('name email');
          if (customer) {
            await emailService.sendOrderStatusUpdate(order, customer._id, 'cancelled').catch(err =>
              console.error('Payment failure email error:', err)
            );
          }
        } catch (emailError) {
          console.error('Failed to send payment failure email:', emailError);
        }
      }
      
      res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed. Your payment was not processed. Please try again or contact support if the amount was deducted from your account.',
        orderId: req.body.orderId
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    
    // ✅ BUG FIX: Handle errors during payment verification
    try {
      const order = await Order.findById(req.body.orderId);
      if (order && order.paymentMethod === 'online' && order.paymentStatus !== 'completed') {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();
      }
    } catch (orderError) {
      console.error('Failed to update order status on error:', orderError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during payment verification. Your order has been cancelled. Please contact support if the amount was deducted from your account.',
      orderId: req.body.orderId,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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