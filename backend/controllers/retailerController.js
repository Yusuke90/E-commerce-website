const Product = require('../models/productModel');
const User = require('../models/userModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/products/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});
// Retailer creates a product (B2C - for customers to buy)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, retailPrice, stock, sourceWholesaler, isLocalProduct, region } = req.body;

    // ADD THIS LINE
    const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

    const product = new Product({
      name,
      description,
      category,
      retailPrice,
      stock,
      owner: req.user._id,
      ownerType: 'retailer',
      sourceWholesaler,
      wholesaleEnabled: false,
      isLocalProduct: !!isLocalProduct,
      region,
      images // ADD THIS LINE
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
};

// List retailer's own products
exports.listMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      owner: req.user._id,
      ownerType: 'retailer'
    }).populate('sourceWholesaler', 'name email wholesalerInfo.companyName');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'server error' })
  }
};

// Browse wholesaler products (for retailers to order from - B2B)
exports.browseWholesalerProducts = async (req, res) => {
  try {
    const products = await Product.find({
      ownerType: 'wholesaler',
      wholesaleEnabled: true,  // ✅ Only show wholesale-enabled products
      stock: { $gt: 0 }  // Only in-stock items
    })
      .populate('owner', 'companyName address phone')  // Get wholesaler info
      .sort({ createdAt: -1 });

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching wholesaler products', error: err.message });
  }
};

// Add wholesaler product to retailer's inventory (proxy availability)
// This allows retailer to show wholesaler's products without physically stocking them
exports.addProxyProduct = async (req, res) => {
  try {
    const { wholesalerProductId, markup, quantity } = req.body;

    const wholesalerProduct = await Product.findOne({
      _id: wholesalerProductId,
      ownerType: 'wholesaler'
    });

    if (!wholesalerProduct) {
      return res.status(404).json({ message: 'Wholesaler product not found' });
    }

    // Determine quantity to add (use provided quantity or minimum order quantity)
    const qtyToAdd = quantity || wholesalerProduct.wholesaleMinQty || 1;

    // Check if wholesaler has enough stock
    if (wholesalerProduct.stock < qtyToAdd) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${wholesalerProduct.stock} units available` 
      });
    }

    // Check if retailer already has this product
    const existingProduct = await Product.findOne({
      owner: req.user._id,
      sourceWholesaler: wholesalerProduct.owner,
      name: wholesalerProduct.name,
      ownerType: 'retailer'
    });

    let retailerProduct;

    if (existingProduct) {
      // Update existing product stock
      existingProduct.stock += qtyToAdd;
      // Update retail price if markup is provided
      if (markup) {
        existingProduct.retailPrice = wholesalerProduct.wholesalePrice * (1 + (markup || 0.2));
      }
      await existingProduct.save();
      retailerProduct = existingProduct;
    } else {
      // Create a new product for the retailer
      retailerProduct = new Product({
        name: wholesalerProduct.name,
        description: wholesalerProduct.description,
        category: wholesalerProduct.category,
        retailPrice: wholesalerProduct.wholesalePrice * (1 + (markup || 0.2)), // 20% markup default
        stock: qtyToAdd, // Add the specified quantity
        owner: req.user._id,
        ownerType: 'retailer',
        sourceWholesaler: wholesalerProduct.owner,
        wholesaleEnabled: false,
        isLocalProduct: wholesalerProduct.isLocalProduct,
        region: wholesalerProduct.region,
        images: wholesalerProduct.images
      });
      await retailerProduct.save();
    }

    // ✅ Reduce wholesaler's stock
    wholesalerProduct.stock -= qtyToAdd;
    await wholesalerProduct.save();

    res.status(201).json({
      message: `Product added to your inventory. ${qtyToAdd} units added.`,
      product: retailerProduct
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({
      _id: id,
      owner: req.user._id,
      ownerType: 'retailer'
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, req.body);
    product.updatedAt = Date.now();
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({
      _id: id,
      owner: req.user._id,
      ownerType: 'retailer'
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
exports.upload = upload;