import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';

const Cart = () => {
    const { cart, loading, updateCartItem, removeFromCart } = useCart();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) {
            // If quantity would be 0 or less, remove the item instead
            await handleRemove(productId, true);
            return;
        }
        try {
            const result = await updateCartItem(productId, newQuantity);
            if (!result.success) {
                error(result.message || 'Failed to update cart');
            } else {
                success('Cart updated');
            }
        } catch (err) {
            console.error('Error updating cart:', err);
            error('Failed to update cart. Please try again.');
        }
    };

    const handleRemove = async (productId, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm('Remove this item from cart?')) {
            return;
        }
        try {
            const result = await removeFromCart(productId);
            if (!result.success) {
                error(result.message || 'Failed to remove item');
            } else {
                success('Item removed from cart');
            }
        } catch (err) {
            console.error('Error removing from cart:', err);
            error('Failed to remove item. Please try again.');
        }
    };

    if (loading) return <Loading />;

    if (!cart || cart.items.length === 0) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1>Shopping Cart</h1>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <h3>Your cart is empty</h3>
                    <p style={{ marginBottom: '20px' }}>Start shopping to add items to your cart</p>
                    <Link to="/products" className="btn btn-primary">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1>Shopping Cart</h1>
                <p>{cart.items.length} items in your cart</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* Cart Items */}
                <div>
                    <div className="card">
                        <table className="cart-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.items.map((item) => {
                                    const productId = typeof item.product === 'object' ? item.product._id : item.product;
                                    const productName = typeof item.product === 'object' ? item.product.name : 'Product';
                                    const productStock = typeof item.product === 'object' ? item.product.stock : 0;
                                    
                                    return (
                                        <tr key={item._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div
                                                        style={{
                                                            width: '60px',
                                                            height: '60px',
                                                            backgroundColor: '#ecf0f1',
                                                            borderRadius: '4px',
                                                            overflow: 'hidden',
                                                            flexShrink: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {typeof item.product === 'object' && item.product.images && item.product.images.length > 0 ? (
                                                            <img
                                                                src={`http://localhost:5000${item.product.images[0]}`}
                                                                alt={productName}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentElement.innerHTML = '📦';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span>📦</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            to={`/products/${productId}`}
                                                            style={{ fontWeight: '600', color: '#2c3e50' }}
                                                        >
                                                            {productName}
                                                        </Link>
                                                        <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
                                                            Stock: {productStock} units
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>₹{item.pricePerUnit.toLocaleString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <button
                                                        onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '5px 10px' }}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleQuantityChange(productId, Number(e.target.value))
                                                        }
                                                        min="1"
                                                        max={productStock}
                                                        style={{ width: '60px', textAlign: 'center', padding: '5px' }}
                                                    />
                                                    <button
                                                        onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '5px 10px' }}
                                                        disabled={item.quantity >= productStock}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>
                                                ₹{(item.pricePerUnit * item.quantity).toLocaleString()}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleRemove(productId)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '5px 15px' }}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cart Summary */}
                <div>
                    <div className="card">
                        <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Subtotal:</span>
                                <span>₹{cart.totalPrice?.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Tax (5%):</span>
                                <span>₹{((cart.totalPrice || 0) * 0.05).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Delivery:</span>
                                <span>
                                    {cart.totalPrice > 500 ? (
                                        <span style={{ color: '#27ae60' }}>FREE</span>
                                    ) : (
                                        '₹50'
                                    )}
                                </span>
                            </div>
                            <hr />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                }}
                            >
                                <span>Total:</span>
                                <span style={{ color: '#27ae60' }}>
                                    ₹
                                    {(
                                        (cart.totalPrice || 0) * 1.05 +
                                        (cart.totalPrice > 500 ? 0 : 50)
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {cart.totalPrice > 500 && (
                            <div
                                style={{
                                    backgroundColor: '#d4edda',
                                    color: '#155724',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    marginBottom: '15px',
                                    fontSize: '14px',
                                }}
                            >
                                🎉 You've qualified for FREE delivery!
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/checkout')}
                            className="btn btn-success"
                            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                        >
                            Proceed to Checkout
                        </button>

                        <Link to="/products">
                            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
                                Continue Shopping
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;