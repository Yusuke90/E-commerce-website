import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB2BCart } from '../context/B2BCartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { createPaymentOrder, verifyPayment, initiateRazorpayPayment } from '../services/payment';

export default function B2BCheckout() {
  const { b2bCart, clearB2BCart, b2bTotal } = useB2BCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    paymentMethod: 'online'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: b2bCart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        paymentMethod: formData.paymentMethod,
        deliveryAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone
        }
      };

      const response = await api.post('/b2b-orders', orderData);
      const order = response.data.order;

      if (formData.paymentMethod === 'online') {
        await handleOnlinePayment(order);
      } else {
        alert('B2B Order placed! Wholesaler will process it.');
        clearB2BCart();
        navigate('/retailer');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async (order) => {
    try {
      const paymentData = await createPaymentOrder(order.totalAmount);
      
      initiateRazorpayPayment(
        {
          ...paymentData,
          customerName: user?.name,
          customerEmail: user?.email,
          customerPhone: formData.phone,
        },
        async (response) => {
          await verifyPayment({
            ...response,
            orderId: order._id
          });
          alert('Payment successful!');
          clearB2BCart();
          navigate('/retailer');
        },
        (error) => {
          setError('Payment failed: ' + error);
        }
      );
    } catch (error) {
      setError('Payment initialization failed');
    }
  };

  if (b2bCart.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>B2B Cart is Empty</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Add products from wholesalers to place bulk orders</p>
          <button
            onClick={() => navigate('/retailer')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Browse Wholesalers
          </button>
        </div>
      </div>
    );
  }

  const subtotal = b2bTotal;
  const tax = subtotal * 0.18;
  const delivery = subtotal > 10000 ? 0 : 500;
  const total = subtotal + tax + delivery;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
          B2B Checkout - Order from Wholesaler
        </h1>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              Delivery Information
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Shop Address"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                  style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  required
                  style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  required
                  pattern="[0-9]{6}"
                  style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  pattern="[0-9]{10}"
                  style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
              </div>

              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}
              >
                <option value="online">💳 Pay Online (Razorpay)</option>
                <option value="bank">🏦 Bank Transfer</option>
                <option value="credit">📋 Credit Terms (30 days)</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? 'Processing...' : 'Place B2B Order'}
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              Order Summary
            </h2>

            {b2bCart.map(item => (
              <div key={item.product._id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                <p style={{ fontWeight: 'bold' }}>{item.product.name}</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {item.quantity} units × ₹{item.product.wholesalePrice}
                </p>
                <p style={{ fontWeight: 'bold', marginTop: '4px' }}>
                  ₹{(item.quantity * item.product.wholesalePrice).toLocaleString()}
                </p>
              </div>
            ))}

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>GST (18%):</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Delivery:</span>
                <span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginTop: '12px' }}>
                <span>Total:</span>
                <span style={{ color: '#10b981' }}>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}