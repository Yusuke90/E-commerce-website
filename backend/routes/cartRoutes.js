const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

// All routes require authentication
router.use(requireAuth);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/update', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:productId', cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

module.exports = router;