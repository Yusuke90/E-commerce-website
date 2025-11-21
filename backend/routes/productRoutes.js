const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public routes (for customers)
router.get('/', productController.listPublic);
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getByCategory);
router.get('/:id', productController.getProduct);

// Protected routes
router.post('/checkout/price', requireAuth, productController.checkoutPrice);

module.exports = router;