import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error: showError, confirm } = useToast();

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load order details');
      console.error(err);
      // Redirect to orders page after 2 seconds if order not found
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (order.status !== 'pending') {
      showError('Only pending orders can be cancelled');
      return;
    }

    const confirmed = await confirm('Are you sure you want to cancel this order?', {
      type: 'warning',
      title: 'Cancel Order',
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order'
    });
    if (!confirmed) return;

    try {
      await api.put(`/orders/${id}/cancel`);
      success('Order cancelled successfully');
      fetchOrderDetails(); // Refresh order details
      // Redirect to orders page after 1 second
      setTimeout(() => {
        navigate('/orders');
      }, 1000);
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
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      completed: '#27ae60',
      failed: '#e74c3c',
      refunded: '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) {
    return <Loading />;
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '50px 20px', textAlign: 'center' }}>
        <h2>Order not found</h2>
        <p>Redirecting to orders page...</p>
        <Link to="/orders" className="btn btn-primary">Go to Orders</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/orders" className="btn btn-secondary" style={{ marginBottom: '20px' }}>
          ← Back to Orders
        </Link>
        <h1 style={{ marginBottom: '10px' }}>Order Details</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Order ID: <strong>{order._id}</strong> | Placed on: {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Order Status Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0' }}>Order Status</h3>
            <span
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: getStatusColor(order.status),
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '14px'
              }}
            >
              {order.status}
            </span>
          </div>
          <div>
            <h3 style={{ margin: '0 0 10px 0' }}>Payment Status</h3>
            <span
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: getPaymentStatusColor(order.paymentStatus),
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '14px'
              }}
            >
              {order.paymentStatus}
            </span>
          </div>
          {order.status === 'pending' && (
            <button onClick={handleCancelOrder} className="btn btn-danger">
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h2 style={{ marginBottom: '20px' }}>Order Items</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {order.items.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '15px',
                padding: '15px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}
            >
              {item.product?.images?.[0] && (
                <img
                  src={item.product.images[0]}
                  alt={item.productName}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{item.productName}</h3>
                {item.product?.description && (
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                    {item.product.description.substring(0, 100)}...
                  </p>
                )}
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                  <span>Quantity: <strong>{item.quantity}</strong></span>
                  <span>Price: <strong>₹{item.pricePerUnit.toLocaleString()}</strong> per unit</span>
                  {item.seller && (
                    <span>Seller: <strong>{item.seller.name || item.seller.email}</strong></span>
                  )}
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
                  ₹{item.totalPrice.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      {order.deliveryAddress && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h2 style={{ marginBottom: '15px' }}>Delivery Address</h2>
          <div style={{ lineHeight: '1.8' }}>
            <p style={{ margin: '5px 0' }}><strong>Street:</strong> {order.deliveryAddress.street}</p>
            <p style={{ margin: '5px 0' }}><strong>City:</strong> {order.deliveryAddress.city}</p>
            <p style={{ margin: '5px 0' }}><strong>State:</strong> {order.deliveryAddress.state}</p>
            <p style={{ margin: '5px 0' }}><strong>Pincode:</strong> {order.deliveryAddress.pincode}</p>
            {order.deliveryAddress.phone && (
              <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {order.deliveryAddress.phone}</p>
            )}
            {order.deliveryAddress.landmark && (
              <p style={{ margin: '5px 0' }}><strong>Landmark:</strong> {order.deliveryAddress.landmark}</p>
            )}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Order Summary</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
            <span>Subtotal:</span>
            <strong>₹{order.subtotal.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
            <span>Tax (5%):</span>
            <strong>₹{order.tax.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
            <span>Delivery Fee:</span>
            <strong>₹{order.deliveryFee.toLocaleString()}</strong>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#27ae60' }}>
              <span>Discount:</span>
              <strong>-₹{order.discount.toLocaleString()}</strong>
            </div>
          )}
          <hr style={{ margin: '10px 0', border: 'none', borderTop: '2px solid #e0e0e0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
            <span>Total:</span>
            <span>₹{order.totalAmount.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <p style={{ margin: '5px 0' }}><strong>Payment Method:</strong> {order.paymentMethod.toUpperCase()}</p>
            {order.paymentId && (
              <p style={{ margin: '5px 0' }}><strong>Payment ID:</strong> {order.paymentId}</p>
            )}
            {order.trackingNumber && (
              <p style={{ margin: '5px 0' }}><strong>Tracking Number:</strong> {order.trackingNumber}</p>
            )}
            {order.estimatedDelivery && (
              <p style={{ margin: '5px 0' }}>
                <strong>Estimated Delivery:</strong> {new Date(order.estimatedDelivery).toLocaleDateString()}
              </p>
            )}
            {order.deliveredAt && (
              <p style={{ margin: '5px 0' }}>
                <strong>Delivered On:</strong> {new Date(order.deliveredAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Notes */}
      {order.customerNotes && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
          <h3 style={{ marginBottom: '10px' }}>Your Notes</h3>
          <p style={{ margin: 0 }}>{order.customerNotes}</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;

