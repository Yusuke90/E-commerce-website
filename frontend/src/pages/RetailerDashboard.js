// RetailerDashboard.js - Complete Component with B2B Cart
import React, { useState, useEffect } from 'react';
import { useB2BCart } from '../context/B2BCartContext';
import { useToast } from '../context/ToastContext';

export default function RetailerDashboard() {
  const { success, error, confirm } = useToast();
  const [activeTab, setActiveTab] = useState('browse'); // browse, myProducts, addProduct, orders
  const [wholesalerProducts, setWholesalerProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // B2B Cart
  const { addToB2BCart } = useB2BCart();
  const [orderQuantities, setOrderQuantities] = useState({});

  // Form state for adding own products
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    retailPrice: '',
    stock: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchWholesalerProducts();
    fetchMyProducts();
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchWholesalerProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      // Changed to match your backend route
      const response = await fetch('http://localhost:5000/api/retailer/browse-wholesalers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Wholesaler products:', data);
      setWholesalerProducts(data.products || data); // Handle both response formats
    } catch (error) {
      console.error('Error fetching wholesaler products:', error);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      // Changed to match your backend route (no /me)
      const response = await fetch('http://localhost:5000/api/retailer/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('My products:', data);
      setMyProducts(data);
    } catch (error) {
      console.error('Error fetching my products:', error);
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

  const addProxyProduct = async (wholesalerProductId, product) => {
    const markup = prompt('Enter markup percentage (e.g., 20 for 20%)', '20');
    if (!markup) return;

    const quantity = prompt(`Enter quantity to add (Min: ${product.wholesaleMinQty || 1}, Max: ${product.stock})`, product.wholesaleMinQty || 1);
    if (!quantity) return;

    const qty = parseInt(quantity);
    if (qty < (product.wholesaleMinQty || 1) || qty > product.stock) {
      error(`Quantity must be between ${product.wholesaleMinQty || 1} and ${product.stock}`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Changed to match your backend route
      const response = await fetch('http://localhost:5000/api/retailer/add-proxy-product', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wholesalerProductId: wholesalerProductId,
          markup: parseFloat(markup) / 100,
          quantity: qty
        })
      });

      if (response.ok) {
        const data = await response.json();
        success(data.message || 'Product added to your store!');
        fetchMyProducts();
        fetchWholesalerProducts(); // Refresh to show updated stock
      } else {
        const err = await response.json();
        error(`Error: ${err.message}`);
      }
    } catch (err) {
      console.error('Error adding proxy product:', err);
      error('Failed to add product');
    }
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

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    images.forEach(image => {
      formDataToSend.append('images', image);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/retailer/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        success('Product added successfully!');
        setFormData({
          name: '', description: '', category: 'Electronics',
          retailPrice: '', stock: ''
        });
        setImages([]);
        setImagePreviews([]);
        fetchMyProducts();
        setActiveTab('myProducts');
      }
    } catch (err) {
      error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Retailer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your products and browse wholesale marketplace</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-green-800 font-semibold">My Products</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{myProducts.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-blue-800 font-semibold">Wholesale Products Available</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{wholesalerProducts.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-purple-800 font-semibold">In Stock</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">
              {myProducts.filter(p => p.stock > 0).length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b bg-gradient-to-r from-gray-50 to-white">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
                activeTab === 'browse'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              style={{
                borderBottom: activeTab === 'browse' ? '3px solid #2563eb' : '3px solid transparent'
              }}
            >
              🔍 Browse Wholesale
            </button>
            <button
              onClick={() => setActiveTab('myProducts')}
              className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
                activeTab === 'myProducts'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
              style={{
                borderBottom: activeTab === 'myProducts' ? '3px solid #16a34a' : '3px solid transparent'
              }}
            >
              🏪 My Products
            </button>
            <button
              onClick={() => setActiveTab('addProduct')}
              className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
                activeTab === 'addProduct'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              style={{
                borderBottom: activeTab === 'addProduct' ? '3px solid #9333ea' : '3px solid transparent'
              }}
            >
              ➕ Add Product
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
                activeTab === 'orders'
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              }`}
              style={{
                borderBottom: activeTab === 'orders' ? '3px solid #ea580c' : '3px solid transparent'
              }}
            >
              📦 Orders
            </button>
          </div>

          <div className="p-6">
            {/* Browse Wholesale Products */}
            {activeTab === 'browse' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Wholesale Marketplace (B2B)</h2>
                <p className="text-gray-600 mb-6">
                  Browse products from wholesalers and add them to your store or order in bulk
                </p>

                {wholesalerProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600">No wholesale products available yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {wholesalerProducts.map(product => (
                      <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                        <div className="h-48 bg-gray-200">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={`http://localhost:5000${product.images[0]}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                            No Image Available
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Wholesale Price:</span>
                              <span className="font-bold text-blue-600">
                                ₹{product.wholesalePrice}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Suggested Retail:</span>
                              <span className="font-semibold">₹{product.retailPrice}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Min Order:</span>
                              <span className="font-semibold">
                                {product.wholesaleMinQty || 1} units
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Stock:</span>
                              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                {product.stock}
                              </span>
                            </div>

                            {/* Order quantity input */}
                            <div className="mt-3">
                              <label className="text-sm text-gray-600 block mb-1">Order Quantity:</label>
                              <input
                                type="number"
                                min={product.wholesaleMinQty || 1}
                                max={product.stock}
                                value={orderQuantities[product._id] || product.wholesaleMinQty || 1}
                                onChange={(e) => setOrderQuantities({
                                  ...orderQuantities,
                                  [product._id]: parseInt(e.target.value)
                                })}
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                          </div>

                          {/* B2B Cart and Proxy buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => {
                                const qty = orderQuantities[product._id] || product.wholesaleMinQty || 1;
                                addToB2BCart(product, qty);
                                success('Added to B2B cart!');
                              }}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              🛒 Order Bulk
                            </button>
                            <button
                              onClick={() => addProxyProduct(product._id, product)}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              📦 Add to Store
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Products */}
            {activeTab === 'myProducts' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Products</h2>
                <p className="text-gray-600 mb-6">
                  Products visible to customers on your storefront
                </p>

                {myProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏪</div>
                    <p className="text-gray-600">No products in your store yet</p>
                    <button
                      onClick={() => setActiveTab('addProduct')}
                      className="mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                    >
                      ➕ Add Your First Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {myProducts.map(product => (
                      <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
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
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">Price:</span>
                            <span className="font-bold">₹{product.retailPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                              {product.stock}
                            </span>
                          </div>
                          {product.sourceWholesaler && (
                            <div className="mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                From Wholesaler
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Product Form */}
            {activeTab === 'addProduct' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
                <div className="space-y-4 max-w-2xl">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />

                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="3"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Home">Home & Kitchen</option>
                      <option value="Beauty">Beauty & Personal Care</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Retail Price"
                      value={formData.retailPrice}
                      onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />

                    <input
                      type="number"
                      placeholder="Stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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
                          <img
                            key={i}
                            src={preview}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? '⏳ Adding...' : '✅ Add Product'}
                  </button>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Orders</h2>
                <p className="text-gray-600 mb-6">
                  Manage orders from customers
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
                      <div key={order._id} className="border rounded-lg p-6 bg-white">
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
                        <div className="mb-4 p-3 bg-gray-50 rounded">
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
                          <div className="mb-4 p-3 bg-gray-50 rounded">
                            <h4 className="font-semibold mb-1">Delivery Address:</h4>
                            <p className="text-sm text-gray-700">
                              {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                            </p>
                            <p className="text-sm text-gray-700">Phone: {order.deliveryAddress.phone}</p>
                          </div>
                        )}

                        {/* Status Update */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <div className="flex gap-3 flex-wrap">
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
                              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              disabled={!getNextStatus(order.status)}
                            >
                              {getNextStatus(order.status) ?
                                `➡️ Mark as ${getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1)}`
                                : 'No Next Status'}
                            </button>
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
                                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                              >
                                ✅ Mark as Delivered
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
      </div>
    </div>
  );
}