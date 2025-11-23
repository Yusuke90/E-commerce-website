const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const pickWholesalePrice = require('../utils/pickWholesalePrice');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name description retailPrice wholesalePrice stock images ownerType');
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    
    // ✅ BUG FIX: Validate stock for each cart item and remove out-of-stock items
    const validItems = [];
    const removedItems = [];
    
    for (const item of cart.items) {
      if (!item.product) {
        // Product was deleted
        removedItems.push({ productId: item.product, reason: 'Product no longer exists' });
        continue;
      }
      
      // Check if product has sufficient stock
      if (item.product.stock < item.quantity) {
        if (item.product.stock === 0) {
          removedItems.push({ 
            productId: item.product._id, 
            productName: item.product.name,
            reason: 'Out of stock' 
          });
          continue;
        } else {
          // Adjust quantity to available stock
          item.quantity = item.product.stock;
          removedItems.push({ 
            productId: item.product._id, 
            productName: item.product.name,
            reason: `Only ${item.product.stock} available, quantity adjusted`,
            adjustedQuantity: item.product.stock
          });
        }
      }
      
      validItems.push(item);
    }
    
    // Update cart with valid items only
    if (removedItems.length > 0) {
      cart.items = validItems;
      await cart.save();
    }
    
    // Return cart with warnings if items were removed
    const response = cart.toObject();
    if (removedItems.length > 0) {
      response.warnings = removedItems;
    }
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid productId and quantity required' });
    }
    
    // Check if product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
    }
    
    // Determine price based on user role and product type
    let pricePerUnit;
    if (product.ownerType === 'wholesaler' && req.user.role === 'retailer') {
      // B2B pricing
      pricePerUnit = pickWholesalePrice(product, quantity);
    } else {
      // B2C pricing
      pricePerUnit = product.retailPrice;
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    
    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].pricePerUnit = pricePerUnit;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        pricePerUnit
      });
    }
    
    await cart.save();
    await cart.populate('items.product', 'name description retailPrice stock images');
    
    res.json({ message: 'Item added to cart', cart });
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ 
      message: 'Failed to process cart operation. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity < 0) {
      return res.status(400).json({ message: 'Valid productId and quantity required' });
    }
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not in cart' });
    }
    
    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Only ${product.stock} items available` });
      }
      
      // Update quantity and recalculate price
      cart.items[itemIndex].quantity = quantity;
      // Recalculate price per unit in case it changed
      if (product.ownerType === 'wholesaler' && req.user.role === 'retailer') {
        cart.items[itemIndex].pricePerUnit = pickWholesalePrice(product, quantity);
      } else {
        cart.items[itemIndex].pricePerUnit = product.retailPrice;
      }
    }
    
    await cart.save();
    await cart.populate('items.product', 'name description retailPrice stock images');
    
    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ 
      message: 'Failed to process cart operation. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    await cart.save();
    await cart.populate('items.product', 'name description retailPrice stock images');
    
    res.json({ message: 'Item removed from cart', cart });
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ 
      message: 'Failed to process cart operation. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({ message: 'Cart cleared', cart });
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ 
      message: 'Failed to process cart operation. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};