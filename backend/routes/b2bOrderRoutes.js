const express = require('express');
const router = express.Router();
const { requireAuth, authorizeRoles } = require('../middleware/authMiddleware');
const { validateB2BOrder } = require('../middleware/validation');
const b2bOrderController = require('../controllers/b2bOrderController');

// All routes require authentication
router.use(requireAuth);

// Retailer routes
router.post('/', 
  authorizeRoles('retailer'),
  validateB2BOrder,
  b2bOrderController.createB2BOrder
);

router.get('/my-orders', 
  authorizeRoles('retailer'), 
  b2bOrderController.getMyB2BOrders
);

// Wholesaler routes
router.get('/wholesaler-orders', 
  authorizeRoles('wholesaler'), 
  b2bOrderController.getWholesalerB2BOrders
);

module.exports = router;