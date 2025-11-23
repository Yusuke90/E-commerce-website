// Input validation middleware

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, '')); // Remove non-digits
};

// Validate pincode (Indian format)
const validatePincode = (pincode) => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

// Validate order creation
exports.validateOrder = (req, res, next) => {
  const { paymentMethod, deliveryAddress } = req.body;
  const errors = [];

  if (!paymentMethod) {
    errors.push('Payment method is required');
  } else if (!['online', 'cash'].includes(paymentMethod)) {
    errors.push('Invalid payment method. Must be "online" or "cash"');
  }

  if (!deliveryAddress) {
    errors.push('Delivery address is required');
  } else {
    if (!deliveryAddress.street || deliveryAddress.street.trim().length < 5) {
      errors.push('Street address must be at least 5 characters');
    }
    if (!deliveryAddress.city || deliveryAddress.city.trim().length < 2) {
      errors.push('City is required');
    }
    if (!deliveryAddress.state || deliveryAddress.state.trim().length < 2) {
      errors.push('State is required');
    }
    if (!deliveryAddress.pincode || !validatePincode(deliveryAddress.pincode)) {
      errors.push('Valid 6-digit pincode is required');
    }
    if (!deliveryAddress.phone || !validatePhone(deliveryAddress.phone)) {
      errors.push('Valid 10-digit phone number is required');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors 
    });
  }

  next();
};

// Validate product creation
exports.validateProduct = (req, res, next) => {
  const { name, description, category, retailPrice, stock } = req.body;
  const errors = [];

  if (!name || name.trim().length < 3) {
    errors.push('Product name must be at least 3 characters');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Product description must be at least 10 characters');
  }

  if (!category || category.trim().length < 2) {
    errors.push('Product category is required');
  }

  if (!retailPrice || isNaN(retailPrice) || retailPrice <= 0) {
    errors.push('Valid retail price (greater than 0) is required');
  }

  if (stock === undefined || isNaN(stock) || stock < 0) {
    errors.push('Valid stock quantity (0 or greater) is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Product validation failed', 
      errors 
    });
  }

  next();
};

// Validate B2B order
exports.validateB2BOrder = (req, res, next) => {
  const { items, paymentMethod, deliveryAddress } = req.body;
  const errors = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('At least one order item is required');
  } else {
    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || isNaN(item.quantity) || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Valid quantity (at least 1) is required`);
      }
    });
  }

  if (!paymentMethod) {
    errors.push('Payment method is required');
  } else if (!['online', 'cash'].includes(paymentMethod)) {
    errors.push('Invalid payment method. Must be "online" or "cash"');
  }

  if (!deliveryAddress) {
    errors.push('Delivery address is required');
  } else {
    if (!deliveryAddress.street || deliveryAddress.street.trim().length < 5) {
      errors.push('Street address must be at least 5 characters');
    }
    if (!deliveryAddress.city || deliveryAddress.city.trim().length < 2) {
      errors.push('City is required');
    }
    if (!deliveryAddress.state || deliveryAddress.state.trim().length < 2) {
      errors.push('State is required');
    }
    if (!deliveryAddress.pincode || !validatePincode(deliveryAddress.pincode)) {
      errors.push('Valid 6-digit pincode is required');
    }
    if (!deliveryAddress.phone || !validatePhone(deliveryAddress.phone)) {
      errors.push('Valid 10-digit phone number is required');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'B2B order validation failed', 
      errors 
    });
  }

  next();
};

// Validate cart operations
exports.validateCartItem = (req, res, next) => {
  const { productId, quantity } = req.body;
  const errors = [];

  if (!productId) {
    errors.push('Product ID is required');
  }

  if (quantity === undefined || isNaN(quantity) || quantity < 1) {
    errors.push('Valid quantity (at least 1) is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Cart item validation failed', 
      errors 
    });
  }

  next();
};

// Validate review
exports.validateReview = (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const errors = [];

  if (!productId) {
    errors.push('Product ID is required');
  }

  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (!comment || comment.trim().length < 10) {
    errors.push('Review comment must be at least 10 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Review validation failed', 
      errors 
    });
  }

  next();
};

