import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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