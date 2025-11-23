import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const Home = () => {
    const { isAuthenticated, user } = useAuth();
    const { cartItemCount, cartTotal } = useCart();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const categories = [
        { name: 'Electronics', icon: '📱', color: '#3498db' },
        { name: 'Groceries', icon: '🛒', color: '#27ae60' },
        { name: 'Clothing', icon: '👕', color: '#e74c3c' },
        { name: 'Home', icon: '🏠', color: '#f39c12' },
        { name: 'Beauty', icon: '💄', color: '#9b59b6' }
    ];

    useEffect(() => {
        fetchFeaturedProducts();
        if (isAuthenticated) {
            fetchRecentOrders();
            fetchStats();
        }
    }, [isAuthenticated, user?.role]);

    const fetchFeaturedProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/products');
            const data = await response.json();
            // Get top 6 products (most recent or highest rated)
            const featured = Array.isArray(data) ? data.slice(0, 6) : [];
            setFeaturedProducts(featured);
        } catch (error) {
            console.error('Error fetching featured products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            if (user?.role === 'customer') {
                const response = await api.get('/orders/my-orders');
                const orders = response.data || [];
                setRecentOrders(orders.slice(0, 3)); // Last 3 orders
            } else if (user?.role === 'retailer' || user?.role === 'wholesaler') {
                const response = await fetch('http://localhost:5000/api/orders/seller/orders', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const orders = await response.json();
                setRecentOrders(Array.isArray(orders) ? orders.slice(0, 3) : []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchStats = async () => {
        try {
            if (user?.role === 'retailer') {
                const [productsRes, ordersRes] = await Promise.all([
                    fetch('http://localhost:5000/api/retailer/products', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    }),
                    fetch('http://localhost:5000/api/orders/seller/orders', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    })
                ]);
                const products = await productsRes.json();
                const orders = await ordersRes.json();
                setStats({
                    totalProducts: Array.isArray(products) ? products.length : 0,
                    totalOrders: Array.isArray(orders) ? orders.length : 0,
                    pendingOrders: Array.isArray(orders) ? orders.filter(o => o.status === 'pending').length : 0
                });
            } else if (user?.role === 'wholesaler') {
                const [productsRes, ordersRes] = await Promise.all([
                    fetch('http://localhost:5000/api/wholesaler/products/me', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    }),
                    fetch('http://localhost:5000/api/b2b-orders/wholesaler-orders', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    })
                ]);
                const products = await productsRes.json();
                const orders = await ordersRes.json();
                setStats({
                    totalProducts: Array.isArray(products) ? products.length : 0,
                    totalOrders: Array.isArray(orders) ? orders.length : 0,
                    pendingOrders: Array.isArray(orders) ? orders.filter(o => o.status === 'pending').length : 0
                });
            } else if (user?.role === 'customer') {
                const response = await api.get('/orders/my-orders');
                const orders = response.data || [];
                setStats({
                    totalOrders: orders.length,
                    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f39c12',
            confirmed: '#3498db',
            processing: '#9b59b6',
            shipped: '#1abc9c',
            delivered: '#27ae60',
            cancelled: '#e74c3c',
        };
        return colors[status] || '#95a5a6';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto p-6">
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '60px 40px',
                textAlign: 'center',
                color: 'white',
                marginBottom: '40px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
                <h1 style={{ fontSize: '48px', marginBottom: '15px', fontWeight: 'bold' }}>
                    {isAuthenticated ? `Welcome back, ${user.name}! 👋` : 'Welcome to LiveMART 🛍️'}
                </h1>
                <p style={{ fontSize: '20px', marginBottom: '30px', opacity: 0.95 }}>
                    {isAuthenticated 
                        ? user.role === 'customer' 
                            ? 'Discover amazing products and great deals'
                            : user.role === 'retailer'
                            ? 'Manage your store and grow your business'
                            : user.role === 'wholesaler'
                            ? 'Connect with retailers and expand your reach'
                            : 'Manage the platform and ensure smooth operations'
                        : 'Your one-stop solution for B2B and B2C commerce'
                    }
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {user?.role === 'customer' && (
                        <>
                            <Link to="/products" className="btn btn-primary" style={{ fontSize: '18px', padding: '12px 30px' }}>
                                🛒 Browse Products
                            </Link>
                            {cartItemCount > 0 && (
                                <Link to="/cart" className="btn" style={{ 
                                    fontSize: '18px', 
                                    padding: '12px 30px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '2px solid white'
                                }}>
                                    🛒 View Cart ({cartItemCount})
                                </Link>
                            )}
                        </>
                    )}
                    {user?.role === 'retailer' && (
                        <Link to="/retailer" className="btn" style={{ 
                            fontSize: '18px', 
                            padding: '12px 30px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '2px solid white'
                        }}>
                            📊 Go to Dashboard
                        </Link>
                    )}
                    {user?.role === 'wholesaler' && (
                        <Link to="/wholesaler" className="btn" style={{ 
                            fontSize: '18px', 
                            padding: '12px 30px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '2px solid white'
                        }}>
                            📊 Go to Dashboard
                        </Link>
                    )}
                    {user?.role === 'admin' && (
                        <Link to="/admin" className="btn" style={{ 
                            fontSize: '18px', 
                            padding: '12px 30px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '2px solid white'
                        }}>
                            ⚙️ Admin Panel
                        </Link>
                    )}
                    {!isAuthenticated && (
                        <>
                            <Link to="/products" className="btn btn-primary" style={{ fontSize: '18px', padding: '12px 30px' }}>
                                Browse Products
                            </Link>
                            <Link to="/register" className="btn" style={{ 
                                fontSize: '18px', 
                                padding: '12px 30px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '2px solid white'
                            }}>
                                Register Now
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Stats for Authenticated Users */}
            {isAuthenticated && stats && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📊 Quick Overview</h2>
                    <div className="dashboard-grid">
                        {user.role === 'customer' && (
                            <>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    <h3>Total Orders</h3>
                                    <div className="stat-value">{stats.totalOrders || 0}</div>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                    <h3>Active Orders</h3>
                                    <div className="stat-value">{stats.pendingOrders || 0}</div>
                                </div>
                                {cartItemCount > 0 && (
                                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                        <h3>Items in Cart</h3>
                                        <div className="stat-value">{cartItemCount}</div>
                                    </div>
                                )}
                            </>
                        )}
                        {(user.role === 'retailer' || user.role === 'wholesaler') && (
                            <>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    <h3>Total Products</h3>
                                    <div className="stat-value">{stats.totalProducts || 0}</div>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                    <h3>Total Orders</h3>
                                    <div className="stat-value">{stats.totalOrders || 0}</div>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                    <h3>Pending Orders</h3>
                                    <div className="stat-value">{stats.pendingOrders || 0}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Featured Products (for customers and guests) */}
            {(user?.role === 'customer' || !isAuthenticated) && featuredProducts.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h2 style={{ color: '#2c3e50' }}>⭐ Featured Products</h2>
                        <Link to="/products" style={{ color: '#3498db', textDecoration: 'none', fontWeight: '600' }}>
                            View All →
                        </Link>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '20px'
                    }}>
                        {featuredProducts.map(product => (
                            <Link
                                key={product._id}
                                to={`/products/${product._id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                                >
                                    <div style={{ height: '180px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={`http://localhost:5000${product.images[0]}`}
                                                alt={product.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#9ca3af',
                                                fontSize: '48px'
                                            }}>
                                                📦
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        <h3 style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            marginBottom: '8px',
                                            color: '#2c3e50',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {product.name}
                                        </h3>
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#7f8c8d',
                                            marginBottom: '10px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {product.description}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
                                                ₹{product.retailPrice?.toLocaleString()}
                                            </span>
                                            {product.stock > 0 ? (
                                                <span style={{ fontSize: '12px', color: '#27ae60' }}>
                                                    In Stock
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#e74c3c' }}>
                                                    Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Quick Links */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ marginBottom: '25px', color: '#2c3e50' }}>🛍️ Shop by Category</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px'
                }}>
                    {categories.map(category => (
                        <Link
                            key={category.name}
                            to={`/products?category=${category.name}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '25px 20px',
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                border: `2px solid ${category.color}20`
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 8px 16px ${category.color}30`;
                                e.currentTarget.style.borderColor = category.color;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                e.currentTarget.style.borderColor = `${category.color}20`;
                            }}
                            >
                                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                                    {category.icon}
                                </div>
                                <h3 style={{
                                    color: category.color,
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    margin: 0
                                }}>
                                    {category.name}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Orders (for authenticated users) */}
            {isAuthenticated && recentOrders.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h2 style={{ color: '#2c3e50' }}>📦 Recent Orders</h2>
                        <Link to="/orders" style={{ color: '#3498db', textDecoration: 'none', fontWeight: '600' }}>
                            View All →
                        </Link>
                    </div>
                    <div className="card">
                        {recentOrders.map(order => (
                            <div
                                key={order._id}
                                style={{
                                    padding: '15px',
                                    marginBottom: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${getStatusColor(order.status)}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <p style={{ fontWeight: '600', marginBottom: '5px' }}>
                                            Order #{order._id.slice(-8).toUpperCase()}
                                        </p>
                                        <p style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                        <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
                                            {order.items?.length || 0} item(s) • ₹{order.totalAmount?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        backgroundColor: `${getStatusColor(order.status)}20`,
                                        color: getStatusColor(order.status),
                                        textTransform: 'capitalize'
                                    }}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions for Different Roles */}
            {isAuthenticated && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ marginBottom: '25px', color: '#2c3e50' }}>⚡ Quick Actions</h2>
                    <div className="dashboard-grid">
                        {user.role === 'customer' && (
                            <>
                                <Link to="/products" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#3498db', marginBottom: '10px' }}>🛍️ Browse Products</h3>
                                    <p>Explore our wide selection of products</p>
                                </Link>
                                {cartItemCount > 0 && (
                                    <Link to="/cart" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h3 style={{ color: '#27ae60', marginBottom: '10px' }}>🛒 View Cart</h3>
                                        <p>{cartItemCount} item(s) • ₹{cartTotal?.toLocaleString() || 0}</p>
                                    </Link>
                                )}
                                <Link to="/orders" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>📦 My Orders</h3>
                                    <p>Track your orders and delivery status</p>
                                </Link>
                            </>
                        )}
                        {user.role === 'retailer' && (
                            <>
                                <Link to="/retailer" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#3498db', marginBottom: '10px' }}>📊 Dashboard</h3>
                                    <p>Manage your products and orders</p>
                                </Link>
                                <Link to="/retailer" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#27ae60', marginBottom: '10px' }}>🏪 Browse Wholesalers</h3>
                                    <p>Find products to add to your store</p>
                                </Link>
                                <Link to="/retailer" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#f39c12', marginBottom: '10px' }}>📦 Manage Orders</h3>
                                    <p>Update order status and track sales</p>
                                </Link>
                            </>
                        )}
                        {user.role === 'wholesaler' && (
                            <>
                                <Link to="/wholesaler" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#3498db', marginBottom: '10px' }}>📊 Dashboard</h3>
                                    <p>Manage your products and orders</p>
                                </Link>
                                <Link to="/wholesaler" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#27ae60', marginBottom: '10px' }}>➕ Add Product</h3>
                                    <p>Create new products or bulk upload</p>
                                </Link>
                                <Link to="/wholesaler" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ color: '#f39c12', marginBottom: '10px' }}>📦 Manage Orders</h3>
                                    <p>View and update B2B orders</p>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Features Section */}
            <div style={{ marginTop: '40px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>Why Choose LiveMART?</h2>
                <div className="dashboard-grid">
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#3498db', marginBottom: '10px', fontSize: '32px' }}>🛍️</h3>
                        <h3 style={{ color: '#3498db', marginBottom: '10px' }}>Wide Selection</h3>
                        <p>Thousands of products across multiple categories</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#27ae60', marginBottom: '10px', fontSize: '32px' }}>✓</h3>
                        <h3 style={{ color: '#27ae60', marginBottom: '10px' }}>Verified Sellers</h3>
                        <p>All retailers and wholesalers are admin-approved</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#e74c3c', marginBottom: '10px', fontSize: '32px' }}>🚚</h3>
                        <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>Fast Delivery</h3>
                        <p>Quick and reliable delivery to your doorstep</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#f39c12', marginBottom: '10px', fontSize: '32px' }}>💰</h3>
                        <h3 style={{ color: '#f39c12', marginBottom: '10px' }}>Best Prices</h3>
                        <p>Competitive pricing with wholesale options</p>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default Home;
