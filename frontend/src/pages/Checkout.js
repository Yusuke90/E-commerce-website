import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { createPaymentOrder, verifyPayment, initiateRazorpayPayment } from '../services/payment';
import Loading from '../components/Loading';

const Checkout = () => {
    const { cart, loading: cartLoading, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        street: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        landmark: '',
        paymentMethod: 'online',
        customerNotes: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Calculate totals
        const subtotal = cart.totalPrice || 0;
        const tax = subtotal * 0.05;
        const delivery = subtotal > 500 ? 0 : 50;
        const total = subtotal + tax + delivery;

        try {
            const orderData = {
                paymentMethod: formData.paymentMethod,
                deliveryAddress: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    phone: formData.phone,
                    landmark: formData.landmark,
                },
                customerNotes: formData.customerNotes,
                totalAmount: total, // Use calculated total (subtotal + tax + delivery)
            };

            // Create order in database (with pending payment)
            const orderResponse = await api.post('/orders', orderData);
            const order = orderResponse.data.order;

            // If payment method is online, initiate Razorpay
            if (formData.paymentMethod === 'online') {
                setProcessingPayment(true);
                await handleOnlinePayment(order, total);
            } else {
                // Cash on delivery - order is complete
                alert('Order placed successfully!');
                await clearCart();
                navigate('/orders');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    const handleOnlinePayment = async (order, totalAmount) => {
        try {
            // Step 1: Create Razorpay order with the correct total amount
            const paymentOrderData = await createPaymentOrder(totalAmount);

            // Step 2: Initialize Razorpay checkout
            initiateRazorpayPayment(
                {
                    keyId: paymentOrderData.keyId,
                    amount: paymentOrderData.amount,
                    currency: paymentOrderData.currency,
                    orderId: paymentOrderData.orderId,
                    customerName: user?.name,
                    customerEmail: user?.email,
                    customerPhone: formData.phone,
                },
                // Success callback
                async (response) => {
                    try {
                        // Verify payment on backend
                        const verificationData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: order._id,
                        };

                        const verifyResponse = await verifyPayment(verificationData);

                        if (verifyResponse.success) {
                            alert('Payment successful! Order confirmed.');
                            await clearCart();
                            navigate('/orders');
                        } else {
                            setError('Payment verification failed');
                        }
                    } catch (err) {
                        setError('Payment verification failed');
                    } finally {
                        setProcessingPayment(false);
                    }
                },
                // Failure callback
                (error) => {
                    setError(error);
                    setProcessingPayment(false);
                }
            );
        } catch (err) {
            setError('Failed to initiate payment');
            setProcessingPayment(false);
        }
    };

    if (cartLoading) return <Loading />;

    const cartItems = cart?.items || [];

    if (cartItems.length === 0) {
        return (
            <div className="container">
                <div className="alert alert-warning">
                    Your cart is empty. Add items before checking out.
                </div>
                <button onClick={() => navigate('/products')} className="btn btn-primary">
                    Browse Products
                </button>
            </div>
        );
    }

    const subtotal = cart?.totalPrice || 0;
    const tax = subtotal * 0.05;
    const delivery = subtotal > 500 ? 0 : 50;
    const total = subtotal + tax + delivery;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Checkout</h1>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {processingPayment && (
                <div className="alert alert-info">
                    Processing payment... Please complete the payment in the popup window.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Delivery Information</h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Street Address *</label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                placeholder="House/Flat No., Building Name, Street"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>State *</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="State"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Pincode *</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="Pincode"
                                    required
                                    pattern="[0-9]{6}"
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="10-digit phone number"
                                    required
                                    pattern="[0-9]{10}"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Landmark</label>
                            <input
                                type="text"
                                name="landmark"
                                value={formData.landmark}
                                onChange={handleChange}
                                placeholder="Nearby landmark (optional)"
                            />
                        </div>

                        <div className="form-group">
                            <label>Payment Method *</label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                            >
                                <option value="online">💳 Pay Online (Razorpay)</option>
                                <option value="cash">💵 Cash on Delivery</option>
                            </select>
                            {formData.paymentMethod === 'online' && (
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                    ✅ Secure payment powered by Razorpay
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Order Notes</label>
                            <textarea
                                name="customerNotes"
                                value={formData.customerNotes}
                                onChange={handleChange}
                                placeholder="Any special instructions for delivery..."
                                rows="3"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success"
                            style={{ width: '100%', padding: '12px', fontSize: '16px', position: 'relative' }}
                            disabled={loading || processingPayment}
                        >
                            {(loading || processingPayment) && (
                                <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                    aria-hidden="true"
                                    style={{
                                        marginRight: '8px',
                                        verticalAlign: 'middle',
                                        width: '1.2em',
                                        height: '1.2em',
                                        borderWidth: '0.2em'
                                    }}
                                ></span>
                            )}
                            {loading ? 'Processing...' : 
                             processingPayment ? 'Completing Payment...' :
                             formData.paymentMethod === 'online' ? '💳 Proceed to Pay' : '🛒 Place Order'}
                        </button>
                    </form>
                </div>

                {/* Order Summary - same as before */}
                <div>
                    <div className="card">
                        <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>

                        <div style={{ marginBottom: '20px' }}>
                            {cartItems.map((item) => (
                                <div
                                    key={item._id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '10px',
                                        paddingBottom: '10px',
                                        borderBottom: '1px solid #eee',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight: '600', marginBottom: '5px' }}>{item.product.name}</p>
                                        <p style={{ fontSize: '14px', color: '#7f8c8d' }}>Qty: {item.quantity}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '600' }}>
                                            ₹{(item.pricePerUnit * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Subtotal:</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Tax (5%):</span>
                                <span>₹{tax.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Delivery:</span>
                                <span>
                                    {delivery === 0 ? (
                                        <span style={{ color: '#27ae60' }}>FREE</span>
                                    ) : (
                                        `₹${delivery}`
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
                                <span style={{ color: '#27ae60' }}>₹{total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;