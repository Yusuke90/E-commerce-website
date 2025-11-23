const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { validateReview } = require('../middleware/validation');
const reviewController = require('../controllers/reviewController');

// Get reviews for a product (public)
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes - require authentication
router.use(requireAuth);

// Add review
router.post('/', validateReview, reviewController.addReview);

// Update review
router.put('/:reviewId', reviewController.updateReview);

// Delete review
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;