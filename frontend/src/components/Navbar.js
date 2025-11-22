import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useB2BCart } from '../context/B2BCartContext';

const Navbar = () => {
    const { isAuthenticated, user, logout, isAdmin, isRetailer, isWholesaler } = useAuth();
    const { cartItemCount } = useCart();
    const { b2bItemCount } = useB2BCart(); // Changed from b2bCartItemCount to b2bItemCount

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    LiveMART
                </Link>

                <ul className="navbar-menu">
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/products">Products</Link>
                    </li>

                    {isAuthenticated ? (
                        <>
                            {/* Customer Links */}
                            {user.role === 'customer' && (
                                <>
                                    <li>
                                        <Link to="/cart">
                                            Cart
                                            {cartItemCount > 0 && (
                                                <span className="cart-badge">{cartItemCount}</span>
                                            )}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/orders">My Orders</Link>
                                    </li>
                                </>
                            )}

                            {/* Admin Links */}
                            {isAdmin && (
                                <li>
                                    <Link to="/admin">Admin Dashboard</Link>
                                </li>
                            )}

                            {/* Retailer Links */}
                            {isRetailer && (
                                <>
                                    <li>
                                        <Link to="/retailer">Retailer Dashboard</Link>
                                    </li>
                                    <li>
                                        <Link to="/b2b-checkout">
                                            🛒 B2B Cart
                                            {b2bItemCount > 0 && (
                                                <span className="cart-badge">{b2bItemCount}</span>
                                            )}
                                        </Link>
                                    </li>
                                </>
                            )}

                            {/* Wholesaler Links */}
                            {isWholesaler && (
                                <li>
                                    <Link to="/wholesaler">Wholesaler Dashboard</Link>
                                </li>
                            )}

                            <li>
                                <span style={{ opacity: 0.8 }}>
                                    Hi, {user.name || user.email}
                                </span>
                            </li>
                            <li>
                                <button onClick={logout}>Logout</button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/login">Login</Link>
                            </li>
                            <li>
                                <Link to="/register">Register</Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;