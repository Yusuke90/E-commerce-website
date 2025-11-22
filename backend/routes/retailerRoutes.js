const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

// ✅ Browse wholesaler products
router.get('/browse-wholesalers', retailerController.browseWholesalerProducts);

// Create own product
router.post('/products', retailerController.upload.array('images'), retailerController.createProduct);

// List retailer's own products
router.get('/products', retailerController.listMyProducts);

// Update/Delete own product
router.put('/products/:id', retailerController.updateProduct);
router.delete('/products/:id', retailerController.deleteProduct);

// Add wholesaler product to inventory (proxy)
router.post('/add-proxy-product', retailerController.addProxyProduct);

// Update retailer location
router.put('/location', retailerController.updateLocation);

module.exports = router;