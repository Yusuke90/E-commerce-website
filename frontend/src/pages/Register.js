import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        // Retailer fields
        shopName: '',
        // Wholesaler fields
        companyName: '',
        // Common fields
        gstNumber: '',
        address: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Prepare data based on role
        let userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
        };

        if (formData.role === 'retailer') {
            userData = {
                ...userData,
                shopName: formData.shopName,
                gstNumber: formData.gstNumber,
                address: formData.address,
                phone: formData.phone,
            };
        } else if (formData.role === 'wholesaler') {
            userData = {
                ...userData,
                companyName: formData.companyName,
                gstNumber: formData.gstNumber,
                address: formData.address,
                phone: formData.phone,
            };
        }

        const result = await register(userData);

        if (result.success) {
            setSuccess('Registration successful! Logging you in...');
            
            // Automatically log in after successful registration
            try {
                const loginResult = await login(formData.email, formData.password);
                
                if (loginResult.success) {
                    // Redirect based on role
                    const user = loginResult.user;
                    if (user.role === 'admin') {
                        navigate('/admin');
                    } else if (user.role === 'retailer') {
                        navigate('/retailer');
                    } else if (user.role === 'wholesaler') {
                        navigate('/wholesaler');
                    } else {
                        navigate('/products');
                    }
                } else {
                    // Login failed (e.g., retailer/wholesaler not approved yet)
                    setError(loginResult.message || 'Registration successful, but your account is pending approval. Please login after admin approval.');
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
            } catch (err) {
                // If auto-login fails, still show success and redirect to login
                setError('Registration successful! Please login to continue.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="container">
            <div style={{ maxWidth: '500px', margin: '50px auto' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Register</h2>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* Role Selection */}
                        <div className="form-group">
                            <label>Register as</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="customer">Customer</option>
                                <option value="retailer">Retailer</option>
                                <option value="wholesaler">Wholesaler</option>
                            </select>
                        </div>

                        {/* Common Fields */}
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password (min 6 characters)"
                                required
                                minLength="6"
                            />
                        </div>

                        {/* Retailer Specific Fields */}
                        {formData.role === 'retailer' && (
                            <>
                                <div className="form-group">
                                    <label>Shop Name</label>
                                    <input
                                        type="text"
                                        name="shopName"
                                        value={formData.shopName}
                                        onChange={handleChange}
                                        placeholder="Enter shop name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>GST Number</label>
                                    <input
                                        type="text"
                                        name="gstNumber"
                                        value={formData.gstNumber}
                                        onChange={handleChange}
                                        placeholder="Enter GST number"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter shop address"
                                        required
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Wholesaler Specific Fields */}
                        {formData.role === 'wholesaler' && (
                            <>
                                <div className="form-group">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Enter company name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>GST Number</label>
                                    <input
                                        type="text"
                                        name="gstNumber"
                                        value={formData.gstNumber}
                                        onChange={handleChange}
                                        placeholder="Enter GST number"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter company address"
                                        required
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="btn btn-success"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '20px' }}>
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;