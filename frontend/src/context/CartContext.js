import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const fetchCart = async () => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            const response = await api.get('/cart');
            setCart(response.data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [isAuthenticated]);

    const addToCart = async (productId, quantity) => {
        try {
            const response = await api.post('/cart/add', { productId, quantity });
            setCart(response.data.cart);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to add to cart'
            };
        }
    };

    const updateCartItem = async (productId, quantity) => {
        try {
            const response = await api.put('/cart/update', { productId, quantity });
            setCart(response.data.cart);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update cart'
            };
        }
    };

    const removeFromCart = async (productId) => {
        try {
            const response = await api.delete(`/cart/remove/${productId}`);
            setCart(response.data.cart);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to remove from cart'
            };
        }
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart/clear');
            setCart(null);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    };

    const cartItemCount = cart?.items?.length || 0;
    const cartTotal = cart?.totalPrice || 0;

    const value = {
        cart,
        loading,
        cartItemCount,
        cartTotal,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};