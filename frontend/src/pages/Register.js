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
    const [step, setStep] = useState(1); // 1: form, 2: OTP verification
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    const { sendRegistrationOTP, verifyRegistrationOTP, setUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Basic validation
        if (!formData.email || !formData.password || !formData.name) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        const result = await sendRegistrationOTP(formData.email);

        if (result.success) {
            setOtpSent(true);
            setStep(2);
            setSuccess('OTP sent to your email! Please check your inbox.');
            // Start timer (10 minutes)
            setOtpTimer(600);
            const timer = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    // Step 2: Verify OTP and complete registration
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            setLoading(false);
            return;
        }

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

        const result = await verifyRegistrationOTP(userData, otp);

        if (result.success) {
            // Check if auto-login is enabled (for customers)
            if (result.autoLogin && result.token && result.user) {
                // Store token and user
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Update AuthContext state
                if (setUser) {
                    setUser(result.user);
                }
                
                setSuccess('Registration successful! Logging you in...');
                
                // Redirect based on role (should be customer)
                setTimeout(() => {
                    navigate('/products');
                }, 1500);
            } else {
                // For retailer/wholesaler, redirect to login
                setSuccess('Registration successful! Please login after admin approval.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    const handleResendOTP = async () => {
        setError('');
        setLoading(true);
        const result = await sendRegistrationOTP(formData.email);
        if (result.success) {
            setSuccess('OTP resent to your email!');
            setOtpTimer(600);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <div style={{ maxWidth: '500px', margin: '50px auto' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
                        {step === 1 ? 'Register' : 'Verify Email'}
                    </h2>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP}>
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
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP}>
                            <div className="form-group">
                                <label>Enter OTP</label>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                    We've sent a 6-digit code to <strong>{formData.email}</strong>
                                </p>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                    }}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength="6"
                                    required
                                    style={{ 
                                        fontSize: '24px', 
                                        letterSpacing: '8px', 
                                        textAlign: 'center',
                                        fontFamily: 'monospace'
                                    }}
                                />
                                {otpTimer > 0 && (
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                        OTP expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success"
                                style={{ width: '100%', marginBottom: '10px' }}
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? 'Verifying...' : 'Verify & Register'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResendOTP}
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                                disabled={loading || otpTimer > 0}
                            >
                                {otpTimer > 0 ? `Resend OTP (${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')})` : 'Resend OTP'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setOtp('');
                                    setOtpSent(false);
                                    setOtpTimer(0);
                                }}
                                className="btn btn-link"
                                style={{ width: '100%', marginTop: '10px' }}
                            >
                                ← Back to form
                            </button>
                        </form>
                    )}

                    <p style={{ textAlign: 'center', marginTop: '20px' }}>
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;