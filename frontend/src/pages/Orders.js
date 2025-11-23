import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { success, error: showError, confirm } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my-orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = await confirm('Are you sure you want to cancel this order?', {
      type: 'warning',
      title: 'Cancel Order',
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order'
    });
    if (!confirmed) return;

    try {
      await api.put(`/orders/${orderId}/cancel`);
      success('Order cancelled successfully');
      fetchOrders(); // Refresh orders
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel order');
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

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p style={{ color: '#6b7280' }}>Track and manage your orders</p>
        </div>

      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Start shopping to place your first order</p>
          <Link to="/products" className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              {/* Order Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid #ecf0f1',
                }}
              >
                <div>
                  <h3 style={{ marginBottom: '5px' }}>Order #{order._id.slice(-8)}</h3>
                  <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      backgroundColor: getStatusColor(order.status),
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}
                  >
                    {order.status}
                  </span>
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#7f8c8d' }}>
                    {order.orderType || 'B2C'}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: '20px' }}>
                {order.items.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #ecf0f1',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <p style={{ fontWeight: '600', margin: 0 }}>
                          {item.productName || 'Product'}
                        </p>
                        {order.status === 'delivered' && item.product && (
                          <Link
                            to={`/products/${item.product._id || item.product}?review=true`}
                            className="btn btn-primary"
                            style={{ 
                              padding: '4px 12px', 
                              fontSize: '12px',
                              textDecoration: 'none'
                            }}
                          >
                            ✍️ Write Review
                          </Link>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#7f8c8d', margin: 0 }}>
                        Quantity: {item.quantity} × ₹{item.pricePerUnit.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ fontWeight: '600' }}>
                      ₹{item.totalPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                }}
              >
                {/* Delivery Address */}
                <div>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#7f8c8d' }}>
                    DELIVERY ADDRESS
                  </h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {order.deliveryAddress.street}
                    <br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}
                    <br />
                    {order.deliveryAddress.pincode}
                    <br />
                    Phone: {order.deliveryAddress.phone}
                  </p>
                </div>

                {/* Payment & Total */}
                <div>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#7f8c8d' }}>
                    PAYMENT & TOTAL
                  </h4>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <strong>Payment:</strong> {order.paymentMethod.toUpperCase()}
                  </p>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <strong>Subtotal:</strong> ₹{order.subtotal.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <strong>Tax:</strong> ₹{order.tax.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <strong>Delivery:</strong> ₹{order.deliveryFee.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60', marginTop: '10px' }}>
                    Total: ₹{order.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <Link to={`/orders/${order._id}`} className="btn btn-primary">
                  View Details
                </Link>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="btn btn-danger"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {order.customerNotes && (
                <div
                  style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#fff3cd',
                    borderLeft: '4px solid #ffc107',
                    fontSize: '14px',
                  }}
                >
                  <strong>Note:</strong> {order.customerNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;