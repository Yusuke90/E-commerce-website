const Product = require('../models/productModel');
const fs = require('fs');
const csv = require('csv-parse');
const multer = require('multer');
const path = require('path');
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

// Wholesaler creates a product (B2B - for retailers to buy)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, retailPrice, stock, wholesaleMinQty, wholesalePrice, wholesaleTiers, isLocalProduct, region } = req.body;

    // FIX: Correct image path format
    const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

    const product = new Product({
      name,
      description,
      category,
      retailPrice,
      stock,
      owner: req.user._id,
      ownerType: 'wholesaler',
      wholesaleEnabled: true,  // ✅ IMPORTANT: Mark as wholesale
      wholesaleMinQty: wholesaleMinQty || 1,
      wholesalePrice,
      wholesaleTiers: wholesaleTiers ? JSON.parse(wholesaleTiers) : [],
      images,  // ✅ This should work now
      isLocalProduct: !!isLocalProduct,
      region
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Bulk upload products for wholesalers
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const path = req.file.path;
    const parser = fs.createReadStream(path).pipe(csv({ columns: true, trim: true }));
    const jobs = [];

    for await (const rec of parser) {
      const normalizeBoolean = (value, defaultValue = true) => {
        if (value === undefined || value === null || value === '') return defaultValue;
        const normalized = value.toString().trim().toLowerCase();
        if (['true', '1', 'yes'].includes(normalized)) return true;
        if (['false', '0', 'no'].includes(normalized)) return false;
        return defaultValue;
      };

      const p = new Product({
        name: rec.name,
        description: rec.description,
        category: rec.category,
        retailPrice: Number(rec.retailPrice || rec.price || 0),
        stock: Number(rec.stock || 0),
        owner: req.user._id,
        ownerType: 'wholesaler',
        wholesaleEnabled: normalizeBoolean(rec.wholesaleEnabled, true),
        wholesaleMinQty: Number(rec.wholesaleMinQty || 0),
        wholesalePrice: rec.wholesalePrice ? Number(rec.wholesalePrice) : undefined,
        isLocalProduct: normalizeBoolean(rec.isLocalProduct, false),
        region: rec.region
      });
      jobs.push(p.save());
    }

    await Promise.all(jobs);
    fs.unlinkSync(path);
    res.json({ message: 'Products uploaded successfully', count: jobs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message })
  }
};

// List wholesaler's own products
exports.listMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      owner: req.user._id,
      ownerType: 'wholesaler'
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'server error' })
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({
      _id: id,
      owner: req.user._id,
      ownerType: 'wholesaler'
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
      ownerType: 'wholesaler'
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
module.exports.upload = upload;