const express = require('express');
const router = express.Router();
const { requireAuth, authorizeRoles } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes require admin role
router.use(requireAuth, authorizeRoles('admin'));

// Wholesaler management
router.get('/wholesalers/pending', adminController.listPendingWholesalers);
router.post('/wholesaler/:id/approve', adminController.approveWholesaler);

// Retailer management
router.get('/retailers/pending', adminController.listPendingRetailers);
router.post('/retailer/:id/approve', adminController.approveRetailer);

module.exports = router;