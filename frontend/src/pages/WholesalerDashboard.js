import React, { useState, useEffect } from 'react';

export default function WholesalerDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // products, orders
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    retailPrice: '',
    stock: '',
    wholesalePrice: '',
    wholesaleMinQty: '10'
  });
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wholesaler/products/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders/seller/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Order status updated successfully!');
        fetchOrders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'shipped',
      shipped: 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {formDataToSend.append(key, formData[key]);});
    images.forEach(image => {formDataToSend.append('images', image);});

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wholesaler/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Product added successfully!');
        setShowForm(false);
        setFormData({
          name: '', description: '', category: 'Electronics',
          retailPrice: '', stock: '', wholesalePrice: '', wholesaleMinQty: '10'
        });
        setImages([]);
        setImagePreviews([]);
        fetchProducts();
      }
    } catch (error) {
      alert('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Wholesaler Dashboard</h1>
          
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-semibold ${activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-semibold ${activeTab === 'orders'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Products</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  {showForm ? 'Cancel' : 'Add Product'}
                </button>
              </div>
            </div>

            {showForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
              
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home">Home & Kitchen</option>
                </select>

                <input
                  type="number"
                  placeholder="Retail Price"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({...formData, retailPrice: e.target.value})}
                  className="px-4 py-2 border rounded-lg"
                />

                <input
                  type="number"
                  placeholder="Stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="px-4 py-2 border rounded-lg"
                />

                <input
                  type="number"
                  placeholder="Wholesale Price"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({...formData, wholesalePrice: e.target.value})}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Upload Images (Max 5)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {imagePreviews.map((preview, i) => (
                      <img key={i} src={preview} alt={`Preview ${i+1}`} className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Your Products</h2>
              {products.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No products yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {products.map(product => (
                    <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg">
                      <div className="h-48 bg-gray-200">
                        {product.images?.[0] ? (
                          <img 
                            src={`http://localhost:5000${product.images[0]}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        <div className="flex justify-between text-sm">
                          <span>Retail: ₹{product.retailPrice}</span>
                          <span className="text-blue-600">Wholesale: ₹{product.wholesalePrice}</span>
                        </div>
                        <div className="mt-2 text-sm">
                          Stock: <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                            {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">My Orders</h2>
            <p className="text-gray-600 mb-6">
              Manage B2B orders from retailers
            </p>

            {ordersLoading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order._id} className="border rounded-lg p-6 bg-gray-50">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-4 pb-4 border-b">
                      <div>
                        <h3 className="text-lg font-bold">Order #{order._id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Customer: {order.customer?.name || 'N/A'} ({order.customer?.email || 'N/A'})
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className="px-4 py-2 rounded-full text-white text-sm font-semibold"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Items:</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{item.productName || 'Product'}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ₹{item.pricePerUnit}
                            </p>
                          </div>
                          <p className="font-semibold">₹{item.totalPrice}</p>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div className="mb-4 p-3 bg-white rounded">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Subtotal:</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tax:</span>
                        <span>₹{order.tax}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Delivery:</span>
                        <span>₹{order.deliveryFee}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                        <span>Total:</span>
                        <span>₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div className="mb-4 p-3 bg-white rounded">
                        <h4 className="font-semibold mb-1">Delivery Address:</h4>
                        <p className="text-sm text-gray-700">
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                        </p>
                        <p className="text-sm text-gray-700">Phone: {order.deliveryAddress.phone}</p>
                      </div>
                    )}

                    {/* Status Update */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const nextStatus = getNextStatus(order.status);
                            if (nextStatus && window.confirm(`Update order status to ${nextStatus}?`)) {
                              updateOrderStatus(order._id, nextStatus);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Mark as {getNextStatus(order.status) ? getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1) : 'Next Status'}
                        </button>
                        {order.status !== 'delivered' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Mark this order as delivered?')) {
                                updateOrderStatus(order._id, 'delivered');
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Mark as Delivered
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}