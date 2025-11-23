import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

export default function WholesalerDashboard() {
  const { success, error, confirm } = useToast();
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
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      error('Failed to load products. Please refresh the page.');
      setProducts([]);
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
    } catch (err) {
      console.error('Error fetching orders:', err);
      error('Failed to load orders');
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
        success('Order status updated successfully!');
        fetchOrders();
      } else {
        const err = await response.json();
        error(`Error: ${err.message}`);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      error('Failed to update order status');
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
      error('Maximum 5 images allowed');
      return;
    }
    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validation
    if (!formData.name || formData.name.trim().length < 3) {
      error('Product name must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      error('Product description must be at least 10 characters');
      setLoading(false);
      return;
    }

    if (!formData.retailPrice || isNaN(formData.retailPrice) || parseFloat(formData.retailPrice) <= 0) {
      error('Please enter a valid retail price (greater than 0)');
      setLoading(false);
      return;
    }

    if (formData.stock === '' || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      error('Please enter a valid stock quantity (0 or greater)');
      setLoading(false);
      return;
    }

    if (!formData.wholesalePrice || isNaN(formData.wholesalePrice) || parseFloat(formData.wholesalePrice) <= 0) {
      error('Please enter a valid wholesale price (greater than 0)');
      setLoading(false);
      return;
    }

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

      const data = await response.json();

      if (response.ok) {
        success('Product added successfully!');
        setShowForm(false);
        setFormData({
          name: '', description: '', category: 'Electronics',
          retailPrice: '', stock: '', wholesalePrice: '', wholesaleMinQty: '10'
        });
        setImages([]);
        setImagePreviews([]);
        fetchProducts();
      } else {
        // Handle error response
        const errorMessage = data.message || data.error || 'Failed to add product';
        const errorDetails = data.errors ? data.errors.join(', ') : '';
        error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }
    } catch (err) {
      console.error('Error adding product:', err);
      error('Failed to add product. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Wholesaler Dashboard</h1>
              <p className="text-gray-600">Manage your products and B2B orders</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md">
                <p className="text-sm opacity-90">Welcome back!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Products</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{totalProducts}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <span className="text-3xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Orders</p>
                <p className="text-4xl font-bold text-orange-600 mt-2">{totalOrders}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <span className="text-3xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Low Stock</p>
                <p className="text-4xl font-bold text-red-600 mt-2">{lowStockProducts}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-full">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Orders</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{pendingOrders}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <span className="text-3xl">⏳</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden border border-gray-100">
          <div className="flex border-b bg-gradient-to-r from-gray-50 to-white">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-8 py-4 font-semibold transition-all duration-300 relative ${
                activeTab === 'products'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              style={{
                borderBottom: activeTab === 'products' ? '3px solid #2563eb' : '3px solid transparent'
              }}
            >
              📦 Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-8 py-4 font-semibold transition-all duration-300 relative ${
                activeTab === 'orders'
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              }`}
              style={{
                borderBottom: activeTab === 'orders' ? '3px solid #ea580c' : '3px solid transparent'
              }}
            >
              📋 Orders
            </button>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
                  <p className="text-gray-600 text-sm mt-1">Add and manage your wholesale products</p>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                >
                  {showForm ? (
                    <>
                      <span>❌</span> Cancel
                    </>
                  ) : (
                    <>
                      <span>➕</span> Add Product
                    </>
                  )}
                </button>
              </div>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                    <textarea
                      placeholder="Enter product description (min 10 characters)"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        required
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Home">Home & Kitchen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Retail Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.retailPrice}
                        onChange={(e) => setFormData({...formData, retailPrice: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Wholesale Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData({...formData, wholesalePrice: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Images (Max 5)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                      />
                      
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                          {imagePreviews.map((preview, i) => (
                            <div key={i} className="relative group">
                              <img 
                                src={preview} 
                                alt={`Preview ${i+1}`} 
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors" 
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> Adding Product...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>✅</span> Add Product
                      </span>
                    )}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your Products</h2>
                <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold">
                  {products.length} {products.length === 1 ? 'Product' : 'Products'}
                </span>
              </div>
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-xl text-gray-600 mb-2">No products yet</p>
                  <p className="text-gray-500">Click "Add Product" to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <div 
                      key={product._id} 
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {product.images?.[0] ? (
                          <img 
                            src={`http://localhost:5000${product.images[0]}`}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <div className="text-5xl mb-2">📷</div>
                              <p className="text-sm">No Image</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-md">
                            {product.category}
                          </span>
                        </div>
                        {product.stock < 10 && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                              Low Stock
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-xl mb-2 text-gray-800 line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">{product.description}</p>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                            <span className="text-sm font-semibold text-gray-600">Retail Price</span>
                            <span className="text-lg font-bold text-gray-800">₹{product.retailPrice}</span>
                          </div>
                          <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg">
                            <span className="text-sm font-semibold text-blue-600">Wholesale Price</span>
                            <span className="text-lg font-bold text-blue-700">₹{product.wholesalePrice}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-600">Stock Available</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              product.stock > 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {product.stock} units
                            </span>
                          </div>
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
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">B2B Orders</h2>
                <p className="text-gray-600 text-sm mt-1">Manage orders from retailers</p>
              </div>
              <span className="bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-semibold">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {ordersLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
                <p className="text-xl text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl text-gray-600 mb-2">No orders yet</p>
                <p className="text-gray-500">Orders from retailers will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order._id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                    {/* Order Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b-2 border-gray-200">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <span className="text-xl">📋</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 ml-12">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Customer:</span> {order.customer?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">{order.customer?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <span
                          className="px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-lg"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📦</span> Order Items
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 mb-1">{item.productName || 'Product'}</p>
                                <p className="text-sm text-gray-600">
                                  Quantity: <span className="font-semibold">{item.quantity}</span> × 
                                  <span className="font-semibold"> ₹{item.pricePerUnit}</span> per unit
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-800">₹{item.totalPrice}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-gray-800 mb-4">Order Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Subtotal:</span>
                          <span className="font-semibold">₹{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Tax:</span>
                          <span className="font-semibold">₹{order.tax}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Delivery Fee:</span>
                          <span className="font-semibold">₹{order.deliveryFee}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-800 mt-4 pt-4 border-t-2 border-blue-300">
                          <span>Total Amount:</span>
                          <span className="text-blue-700">₹{order.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div className="mb-6 p-5 bg-white rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span>📍</span> Delivery Address
                        </h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p className="font-medium">{order.deliveryAddress.street}</p>
                          <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                          <p className="mt-2">
                            <span className="font-semibold">Phone:</span> {order.deliveryAddress.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Status Update */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="flex gap-3 flex-wrap pt-4 border-t-2 border-gray-200">
                        {getNextStatus(order.status) && (
                          <button
                            onClick={async () => {
                              const nextStatus = getNextStatus(order.status);
                              if (nextStatus) {
                                const confirmed = await confirm(`Update order status to ${nextStatus}?`, {
                                  type: 'info',
                                  title: 'Update Order Status',
                                  confirmText: 'Update',
                                  cancelText: 'Cancel'
                                });
                                if (confirmed) {
                                  updateOrderStatus(order._id, nextStatus);
                                }
                              }
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                          >
                            <span>➡️</span>
                            Mark as {getNextStatus(order.status) ? getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1) : 'Next Status'}
                          </button>
                        )}
                        {order.status !== 'delivered' && (
                          <button
                            onClick={async () => {
                              const confirmed = await confirm('Mark this order as delivered?', {
                                type: 'info',
                                title: 'Mark as Delivered',
                                confirmText: 'Mark Delivered',
                                cancelText: 'Cancel'
                              });
                              if (confirmed) {
                                updateOrderStatus(order._id, 'delivered');
                              }
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                          >
                            <span>✅</span>
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