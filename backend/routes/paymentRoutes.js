const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// All routes require authentication
router.use(requireAuth);

// Create Razorpay order
router.post('/create-order', paymentController.createRazorpayOrder);

// Verify payment
router.post('/verify', paymentController.verifyPayment);

// Get payment details
router.get('/:paymentId', paymentController.getPaymentDetails);

module.exports = router;