// Products.js - Beautifully styled with Tailwind CSS
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { calculateDistance, formatDistance } from '../utils/distance';

export default function Products() {
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [nearby, setNearby] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(10); // km

  useEffect(() => {
    fetchProducts();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setNearby(true);
        },
        (error) => {
          alert('Unable to get your location. Please enable location access.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/products';
      if (nearby && userLocation) {
        url += `?nearby=true&lat=${userLocation.lat}&lng=${userLocation.lng}&maxDistance=${maxDistance * 1000}`;
      }
      const response = await fetch(url);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch products' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched products:', data);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        setProducts([]);
        return;
      }
      
      // Calculate distances if user location is available
      if (userLocation && data.length > 0) {
        const productsWithDistance = data.map(product => {
          if (product.owner?.retailerInfo?.location?.coordinates) {
            const [lng, lat] = product.owner.retailerInfo.location.coordinates;
            // Validate coordinates before calculating distance
            if (typeof lat === 'number' && typeof lng === 'number' && 
                !isNaN(lat) && !isNaN(lng) &&
                typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number' &&
                !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
              const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
              return { ...product, distance };
            }
          }
          return product;
        }).sort((a, b) => {
          // Sort by distance if available
          if (a.distance && b.distance) return a.distance - b.distance;
          if (a.distance) return -1;
          if (b.distance) return 1;
          return 0;
        });
        setProducts(productsWithDistance);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert(`Error loading products: ${error.message}. Please try again.`);
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nearby && userLocation) {
      fetchProducts();
    } else if (!nearby) {
      fetchProducts();
    }
  }, [nearby, userLocation, maxDistance]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = category === 'all' || product.category === category;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', 'Electronics', 'Groceries', 'Clothing', 'Home', 'Beauty'];

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingToCartId(product._id);
    const result = await addToCart(product._id, 1);

    if (!result.success) {
      alert(result.message);
    } else {
      alert('Added to cart!');
    }

    setAddingToCartId(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            width: '64px',
            height: '64px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px 16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            All Products
          </h1>
          <p style={{ color: '#6b7280' }}>Browse our collection of products</p>
        </div>

        {/* Search and Filter */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
          
          {/* Nearby Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nearby}
                onChange={(e) => {
                  if (e.target.checked && !userLocation) {
                    getCurrentLocation();
                  } else {
                    setNearby(e.target.checked);
                  }
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>📍 Show Nearby Products</span>
            </label>
            
            {nearby && userLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Within:</span>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
            )}
            
            {nearby && userLocation && (
              <span style={{ fontSize: '12px', color: '#10b981' }}>
                ✓ Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        {/* Products Count */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: '#6b7280' }}>
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
              No products found
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              No retailers have added products yet
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              Retailers need to add products from the wholesaler marketplace first!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', height: '240px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`http://localhost:5000${product.images[0]}`}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
                            <div style="text-align: center;">
                              <div style="font-size: 64px; margin-bottom: 8px;">📦</div>
                              <p>No Image</p>
                            </div>
                          </div>
                        `;
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '8px' }}>📦</div>
                        <p>No Image</p>
                      </div>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                      <span style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div style={{ padding: '16px' }}>
                  <p style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px'
                  }}>
                    {product.category}
                  </p>
                  <h3 style={{
                    fontWeight: 'bold',
                    fontSize: '18px',
                    color: '#1f2937',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {product.name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '12px',
                    height: '40px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {product.description}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Price:</span>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                        ₹{product.retailPrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Stock: </span>
                    <span style={{
                      fontWeight: '600',
                      color: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444'
                    }}>
                      {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Distance */}
                  {product.distance !== undefined && (
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                        📍 {formatDistance(product.distance)}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      to={`/products/${product._id}`}
                      style={{
                        flex: 1,
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        textAlign: 'center',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || addingToCartId === product._id}
                      style={{
                        flex: 1,
                        backgroundColor: product.stock === 0 ? '#9ca3af' : '#10b981',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (product.stock > 0) e.target.style.backgroundColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        if (product.stock > 0) e.target.style.backgroundColor = '#10b981';
                      }}
                    >
                      {addingToCartId === product._id ? 'Adding...' : '🛒 Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}