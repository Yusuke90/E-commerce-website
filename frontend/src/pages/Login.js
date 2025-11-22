import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: credentials, 2: OTP verification
    const [otpTimer, setOtpTimer] = useState(0);

    const { sendLoginOTP, verifyLoginOTP } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Check for OAuth errors in URL
    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'oauth_failed') {
            setError('OAuth login failed. Please try again.');
        } else if (error === 'account_pending') {
            setError('Your account is pending approval. Please contact admin.');
        }
    }, [searchParams]);

    // Handle OAuth login
    const handleOAuthLogin = async (provider) => {
        try {
            const response = await api.get(`/auth/${provider}/url`);
            window.location.href = response.data.authUrl;
        } catch (error) {
            setError(`Failed to initiate ${provider} login`);
        }
    };

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const result = await sendLoginOTP(email, password);

        if (result.success) {
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

    // Step 2: Verify OTP and complete login
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

        const result = await verifyLoginOTP(email, otp);

        if (result.success) {
            // Redirect based on role
            const user = result.user;
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
            setError(result.message);
        }

        setLoading(false);
    };

    const handleResendOTP = async () => {
        setError('');
        setLoading(true);
        const result = await sendLoginOTP(email, password);
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
            <div style={{ maxWidth: '400px', margin: '50px auto' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
                        {step === 1 ? 'Login' : 'Verify Email'}
                    </h2>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            {success}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP}>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', marginBottom: '15px' }}
                                disabled={loading}
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>

                            {/* OAuth Divider */}
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
                                onClick={() => handleOAuthLogin('google')}
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

                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('facebook')}
                                className="btn"
                                style={{ 
                                    width: '100%',
                                    backgroundColor: '#1877F2',
                                    color: '#fff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Continue with Facebook
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP}>
                            <div className="form-group">
                                <label>Enter OTP</label>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                    We've sent a 6-digit code to <strong>{email}</strong>
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
                                className="btn btn-primary"
                                style={{ width: '100%', marginBottom: '10px' }}
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
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
                                    setOtpTimer(0);
                                }}
                                className="btn btn-link"
                                style={{ width: '100%', marginTop: '10px' }}
                            >
                                ← Back to login
                            </button>
                        </form>
                    )}

                    <p style={{ textAlign: 'center', marginTop: '20px' }}>
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;