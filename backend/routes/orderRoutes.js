const express = require('express');
const router = express.Router();
const { requireAuth, authorizeRoles } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// All routes require authentication
router.use(requireAuth);

// Customer routes
router.post('/', orderController.createOrder); // Create order from cart
router.get('/my-orders', orderController.getMyOrders); // Get customer's orders
router.get('/:id', orderController.getOrderById); // Get single order details
router.put('/:id/cancel', orderController.cancelOrder); // Cancel order

// Seller routes (retailers and wholesalers)
router.get('/seller/orders', 
  authorizeRoles('retailer', 'wholesaler'), 
  orderController.getSellerOrders
);

router.put('/:id/status', 
  authorizeRoles('retailer', 'wholesaler', 'admin'), 
  orderController.updateOrderStatus
);

router.get('/seller/stats', 
  authorizeRoles('retailer', 'wholesaler'), 
  orderController.getOrderStats
);

module.exports = router;