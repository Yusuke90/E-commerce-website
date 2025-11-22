import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        // Handle errors from backend
        if (error) {
            console.error('OAuth error:', error);
            navigate(`/login?error=${error}`);
            return;
        }

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                
                // Validate user data
                if (!user.id || !user.email || !user.role) {
                    throw new Error('Invalid user data received');
                }
                
                // Store token and user
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Update AuthContext
                if (setUser) {
                    setUser(user);
                }

                // Redirect based on role and approval status
                if (user.role === 'admin') {
                    navigate('/admin');
                } else if (user.role === 'retailer') {
                    if (user.approved) {
                        navigate('/retailer');
                    } else {
                        navigate('/login?error=account_pending');
                    }
                } else if (user.role === 'wholesaler') {
                    if (user.approved) {
                        navigate('/wholesaler');
                    } else {
                        navigate('/login?error=account_pending');
                    }
                } else {
                    // Customer - always approved
                    navigate('/products');
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                navigate('/login?error=oauth_failed');
            }
        } else {
            navigate('/login?error=oauth_failed');
        }
    }, [searchParams, navigate, setUser]);

    return (
        <div className="container">
            <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
                <div className="card">
                    <h2>Completing login...</h2>
                    <p>Please wait while we log you in.</p>
                </div>
            </div>
        </div>
    );
};

export default OAuthCallback;

