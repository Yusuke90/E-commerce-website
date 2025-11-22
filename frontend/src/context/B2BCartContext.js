import React, { createContext, useContext, useState, useEffect } from 'react';

const B2BCartContext = createContext();

export const useB2BCart = () => {
  const context = useContext(B2BCartContext);
  if (!context) {
    throw new Error('useB2BCart must be used within B2BCartProvider');
  }
  return context;
};

export const B2BCartProvider = ({ children }) => {
  const [b2bCart, setB2BCart] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('b2bCart');
    if (savedCart) {
      setB2BCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('b2bCart', JSON.stringify(b2bCart));
  }, [b2bCart]);

  const addToB2BCart = (product, quantity) => {
    const existingIndex = b2bCart.findIndex(item => item.product._id === product._id);
    
    if (existingIndex > -1) {
      const newCart = [...b2bCart];
      newCart[existingIndex].quantity += quantity;
      setB2BCart(newCart);
    } else {
      setB2BCart([...b2bCart, { product, quantity }]);
    }
  };

  const removeFromB2BCart = (productId) => {
    setB2BCart(b2bCart.filter(item => item.product._id !== productId));
  };

  const updateB2BCartQuantity = (productId, quantity) => {
    setB2BCart(b2bCart.map(item => 
      item.product._id === productId ? { ...item, quantity } : item
    ));
  };

  const clearB2BCart = () => {
    setB2BCart([]);
  };

  const b2bTotal = b2bCart.reduce((sum, item) => {
    const price = item.product.wholesalePrice || 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <B2BCartContext.Provider value={{
      b2bCart,
      addToB2BCart,
      removeFromB2BCart,
      updateB2BCartQuantity,
      clearB2BCart,
      b2bTotal,
      b2bItemCount: b2bCart.reduce((sum, item) => sum + item.quantity, 0)
    }}>
      {children}
    </B2BCartContext.Provider>
  );
};