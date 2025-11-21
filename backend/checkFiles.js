const fs = require('fs');

const requiredFiles = [
  'models/cartModel.js',
  'models/orderModel.js',
  'controllers/cartController.js',
  'controllers/orderController.js',
  'routes/cartRoutes.js',
  'routes/orderRoutes.js'
];

console.log('Checking required files...\n');

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅', file);
  } else {
    console.log('❌ MISSING:', file);
  }
});