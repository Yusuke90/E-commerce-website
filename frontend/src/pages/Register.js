import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';

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
        // Location
        location: null,
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

        // Normalize email
        const normalizedEmail = formData.email.toLowerCase().trim();
        const result = await sendRegistrationOTP(normalizedEmail);

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

        // Normalize and validate OTP
        const normalizedOtp = otp.trim().replace(/\D/g, ''); // Remove non-digits
        if (!normalizedOtp || normalizedOtp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            setLoading(false);
            return;
        }

        // Normalize email
        const normalizedEmail = formData.email.toLowerCase().trim();

        // Prepare data based on role
        let userData = {
            name: formData.name.trim(),
            email: normalizedEmail,
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
                location: formData.location,
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

        const result = await verifyRegistrationOTP(userData, normalizedOtp);

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

    // Handle OAuth registration (only for customers)
    const handleOAuthRegister = async (provider) => {
        try {
            setError('');
            setLoading(true);
            const response = await api.get(`/auth/${provider}/url`);
            window.location.href = response.data.authUrl;
        } catch (error) {
            setError(`Failed to initiate ${provider} registration. Please try again.`);
            setLoading(false);
        }
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
                                <div className="form-group">
                                    <label>Shop Location (Optional - can be updated later)</label>
                                    <LocationPicker
                                        onLocationSelect={(loc) => {
                                            setFormData({
                                                ...formData,
                                                location: loc
                                            });
                                        }}
                                        initialLocation={formData.location ? [formData.location.latitude, formData.location.longitude] : null}
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
                            style={{ width: '100%', marginBottom: '15px' }}
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>

                        {/* OAuth Divider - Only show for customers */}
                        {formData.role === 'customer' && (
                            <>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    margin: '20px 0',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                                    <span style={{ padding: '0 15px', color: '#666', fontSize: '14px' }}>OR</span>
                                    <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                                </div>

                                {/* OAuth Buttons */}
                                <button
                                    type="button"
                                    onClick={() => handleOAuthRegister('google')}
                                    className="btn"
                                    style={{ 
                                        width: '100%', 
                                        marginBottom: '10px',
                                        backgroundColor: '#fff',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18">
                                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.965-2.184l-2.908-2.258c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.053-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                                        <path fill="#FBBC05" d="M3.947 10.698c-.18-.54-.282-1.117-.282-1.698s.102-1.158.282-1.698V4.97H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.03l2.99-2.332z"/>
                                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.97L3.947 7.3C4.66 5.163 6.65 3.58 9 3.58z"/>
                                    </svg>
                                    Continue with Google
                                </button>

                            </>
                        )}
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