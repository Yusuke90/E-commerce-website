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

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                
                // Store token and user
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Update AuthContext
                if (setUser) {
                    setUser(user);
                }

                // Redirect based on role
                if (user.role === 'admin') {
                    navigate('/admin');
                } else if (user.role === 'retailer') {
                    navigate('/retailer');
                } else if (user.role === 'wholesaler') {
                    navigate('/wholesaler');
                } else {
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

