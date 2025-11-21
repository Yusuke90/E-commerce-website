const express = require('express');
const router = express.Router();
const { requireAuth, authorizeRoles } = require('../middleware/authMiddleware');
const wholesalerController = require('../controllers/wholesalerController');

// All routes require authentication
router.use(requireAuth);

// ✅ Use the upload instance from the controller (with proper storage config)
const upload = wholesalerController.upload;

// Product management for wholesalers
router.post('/products',
  authorizeRoles('wholesaler'),
  upload.array('images', 5),
  wholesalerController.createProduct
);

router.post('/products/bulk',
  authorizeRoles('wholesaler'),
  upload.single('file'),
  wholesalerController.bulkUpload
);

router.get('/products/me',
  authorizeRoles('wholesaler'),
  wholesalerController.listMyProducts
);

router.put('/products/:id',
  authorizeRoles('wholesaler'),
  wholesalerController.updateProduct
);

router.delete('/products/:id',
  authorizeRoles('wholesaler'),
  wholesalerController.deleteProduct
);

module.exports = router;