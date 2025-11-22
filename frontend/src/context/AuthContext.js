import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // OTP-based registration
    const sendRegistrationOTP = async (email) => {
        try {
            const response = await api.post('/auth/send-registration-otp', { email });
            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP'
            };
        }
    };

    const verifyRegistrationOTP = async (userData, otp) => {
        try {
            const response = await api.post('/auth/verify-registration-otp', {
                ...userData,
                otp
            });
            return { 
                success: true, 
                message: response.data.message,
                autoLogin: response.data.autoLogin,
                token: response.data.token,
                user: response.data.user
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'OTP verification failed'
            };
        }
    };

    // OTP-based login
    const sendLoginOTP = async (email, password) => {
        try {
            const response = await api.post('/auth/send-login-otp', { email, password });
            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP'
            };
        }
    };

    const verifyLoginOTP = async (email, otp) => {
        try {
            const response = await api.post('/auth/verify-login-otp', { email, otp });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);

            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'OTP verification failed'
            };
        }
    };

    // Legacy functions (kept for backward compatibility if needed)
    const login = async (email, password) => {
        // Use OTP flow instead
        return await sendLoginOTP(email, password);
    };

    const register = async (userData) => {
        // Use OTP flow instead
        return await sendRegistrationOTP(userData.email);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        setUser, // Expose setUser for auto-login after registration
        // OTP functions
        sendRegistrationOTP,
        verifyRegistrationOTP,
        sendLoginOTP,
        verifyLoginOTP,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isRetailer: user?.role === 'retailer',
        isWholesaler: user?.role === 'wholesaler',
        isCustomer: user?.role === 'customer',
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};