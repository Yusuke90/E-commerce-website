const Product = require('../models/productModel');
const User = require('../models/userModel');
const pickWholesalePrice = require('../utils/pickWholesalePrice');

// List products for customers (B2C) - only retailer products
exports.listPublic = async (req,res) => {
  try {
    const { category, minPrice, maxPrice, search, region, nearby, lat, lng, maxDistance } = req.query;
    
    let filter = { 
      ownerType: 'retailer' // Customers only see retailer products
    };
    
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.retailPrice = {};
      if (minPrice) filter.retailPrice.$gte = Number(minPrice);
      if (maxPrice) filter.retailPrice.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }
    if (region) filter.region = region;
    
    let products;
    
    // Location-based filtering
    if (nearby === 'true' && lat && lng) {
      try {
        // Find retailers near the location using $near (requires 2dsphere index)
        // Note: $near only works on fields with 2dsphere index and valid GeoJSON Points
        const nearbyRetailers = await User.find({
          role: 'retailer',
          'retailerInfo.location': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [Number(lng), Number(lat)]
              },
              $maxDistance: Number(maxDistance) || 10000 // default 10km in meters
            }
          }
        }).select('_id');
        
        const retailerIds = nearbyRetailers.map(r => r._id);
        
        // Handle case when no nearby retailers found
        if (retailerIds.length === 0) {
          return res.json([]); // Return empty array if no nearby retailers
        }
        
        filter.owner = { $in: retailerIds };
      } catch (geoError) {
        // If geospatial query fails (e.g., index not created or invalid data), 
        // fall back to manual distance calculation
        console.error('Geospatial query error:', geoError.message);
        console.log('Falling back to manual distance calculation...');
        
        // Get all retailers with valid location data
        const retailersWithLocation = await User.find({
          role: 'retailer',
          'retailerInfo.location': {
            $exists: true,
            $ne: null
          }
        }).select('_id retailerInfo.location');
        
        if (retailersWithLocation.length === 0) {
          return res.json([]);
        }
        
        // Calculate distance manually for each retailer using Haversine formula
        const userLat = Number(lat);
        const userLng = Number(lng);
        const maxDist = Number(maxDistance) || 10000; // in meters
        
        const nearbyRetailerIds = retailersWithLocation
          .filter(retailer => {
            const loc = retailer.retailerInfo?.location;
            if (!loc || !loc.coordinates || !Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) {
              return false;
            }
            
            const [retLng, retLat] = loc.coordinates;
            
            // Validate coordinates
            if (isNaN(retLat) || isNaN(retLng) || isNaN(userLat) || isNaN(userLng)) {
              return false;
            }
            
            // Haversine formula to calculate distance in meters
            const R = 6371000; // Earth radius in meters
            const dLat = (retLat - userLat) * Math.PI / 180;
            const dLng = (retLng - userLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(userLat * Math.PI / 180) * Math.cos(retLat * Math.PI / 180) *
                      Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            
            return distance <= maxDist;
          })
          .map(r => r._id);
        
        if (nearbyRetailerIds.length === 0) {
          return res.json([]);
        }
        
        filter.owner = { $in: nearbyRetailerIds };
      }
    }
    
    products = await Product.find(filter)
      .populate('owner', 'name email retailerInfo.shopName retailerInfo.address retailerInfo.location');
    
    res.json(products);
  } catch (err) { 
    console.error(err);
    res.status(500).json({message:'server error'})
  }
};

// Get single product details
exports.getProduct = async (req,res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('owner', 'name email retailerInfo.shopName retailerInfo.address retailerInfo.phone');
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

// Calculate checkout price for cart items
exports.checkoutPrice = async (req,res) => {
  try {
    // body: [{ productId, qty }, ...]
    const items = req.body.items || [];
    const results = [];
    let total = 0;
    
    for (const it of items) {
      const p = await Product.findById(it.productId);
      if (!p) continue;
      
      let price;
      // If product is from wholesaler and buyer is retailer, use wholesale price
      if (p.ownerType === 'wholesaler' && req.user?.role === 'retailer') {
        price = pickWholesalePrice(p, it.qty);
      } else {
        // Otherwise use retail price
        price = p.retailPrice;
      }
      
      const itemTotal = price * it.qty;
      total += itemTotal;
      
      results.push({ 
        productId: it.productId, 
        name: p.name,
        qty: it.qty, 
        pricePerUnit: price,
        itemTotal
      });
    }
    
    res.json({ items: results, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
};

// Search products with filters
exports.searchProducts = async (req,res) => {
  try {
    const { q, category, minPrice, maxPrice, inStock, isLocal } = req.query;
    
    let filter = { ownerType: 'retailer' };
    
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.retailPrice = {};
      if (minPrice) filter.retailPrice.$gte = Number(minPrice);
      if (maxPrice) filter.retailPrice.$lte = Number(maxPrice);
    }
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (isLocal === 'true') filter.isLocalProduct = true;
    
    const products = await Product.find(filter)
      .populate('owner', 'name retailerInfo.shopName retailerInfo.location');
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

// Get products by category
exports.getByCategory = async (req,res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category, 
      ownerType: 'retailer' 
    }).populate('owner', 'name retailerInfo.shopName');
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
