import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="container">
            <div className="page-header">
                <h1>Welcome to LiveMART</h1>
                <p style={{ fontSize: '18px', color: '#7f8c8d', marginTop: '10px' }}>
                    Your one-stop solution for B2B and B2C commerce
                </p>
            </div>

            {/* Hero Section */}
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
                    {isAuthenticated
                        ? `Welcome back, ${user.name}!`
                        : 'Start Shopping Today'}
                </h2>
                <p style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '30px' }}>
                    Browse thousands of products from verified retailers and wholesalers
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <Link to="/products" className="btn btn-primary">
                        Browse Products
                    </Link>
                    {!isAuthenticated && (
                        <Link to="/register" className="btn btn-success">
                            Register Now
                        </Link>
                    )}
                </div>
            </div>

            {/* Features */}
            <div style={{ marginTop: '40px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Why Choose Us?</h2>
                <div className="dashboard-grid">
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#3498db', marginBottom: '10px' }}>🛍️ Wide Selection</h3>
                        <p>Thousands of products across multiple categories</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#27ae60', marginBottom: '10px' }}>✓ Verified Sellers</h3>
                        <p>All retailers and wholesalers are admin-approved</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>🚚 Fast Delivery</h3>
                        <p>Quick and reliable delivery to your doorstep</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#f39c12', marginBottom: '10px' }}>💰 Best Prices</h3>
                        <p>Competitive pricing with wholesale options</p>
                    </div>
                </div>
            </div>

            {/* User Role Info */}
            {isAuthenticated && (
                <div className="card" style={{ marginTop: '40px', backgroundColor: '#ecf0f1' }}>
                    <h3 style={{ marginBottom: '15px' }}>Your Account</h3>
                    <p><strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <div style={{ marginTop: '20px' }}>
                        {user.role === 'customer' && (
                            <Link to="/products" className="btn btn-primary">
                                Start Shopping
                            </Link>
                        )}
                        {user.role === 'retailer' && (
                            <Link to="/retailer" className="btn btn-primary">
                                Go to Dashboard
                            </Link>
                        )}
                        {user.role === 'wholesaler' && (
                            <Link to="/wholesaler" className="btn btn-primary">
                                Go to Dashboard
                            </Link>
                        )}
                        {user.role === 'admin' && (
                            <Link to="/admin" className="btn btn-primary">
                                Go to Admin Panel
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;