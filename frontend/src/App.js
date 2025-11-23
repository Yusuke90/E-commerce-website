import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { B2BCartProvider } from './context/B2BCartContext';
import { ToastProvider } from './context/ToastContext';
import B2BCheckout from './pages/B2BCheckout';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import WholesalerDashboard from './pages/WholesalerDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <B2BCartProvider>
              <div className="App">
                <Navbar />
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/b2b-checkout" element={
                  <PrivateRoute requiredRole="retailer">
                    <B2BCheckout />
                  </PrivateRoute>
                } />
                {/* Protected Routes */}
                <Route path="/cart" element={
                  <PrivateRoute>
                    <Cart />
                  </PrivateRoute>
                } />
                <Route path="/checkout" element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                } />
                <Route path="/orders" element={
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <PrivateRoute requiredRole="admin">
                    <AdminDashboard />
                  </PrivateRoute>
                } />

                {/* Retailer Routes */}
                <Route path="/retailer" element={
                  <PrivateRoute requiredRole="retailer">
                    <RetailerDashboard />
                  </PrivateRoute>
                } />

                {/* Wholesaler Routes */}
                <Route path="/wholesaler" element={
                  <PrivateRoute requiredRole="wholesaler">
                    <WholesalerDashboard />
                  </PrivateRoute>
                } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </B2BCartProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;