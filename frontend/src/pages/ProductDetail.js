import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Loading from '../components/Loading';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isCustomer } = useAuth();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [success, setSuccess] = useState('');
    const [reviews, setReviews] = useState([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
    });
    const [reviewLoading, setReviewLoading] = useState(false);

    useEffect(() => {
        fetchProduct();
        fetchReviews();
        // Auto-open review form if coming from orders page
        if (searchParams.get('review') === 'true' && isAuthenticated) {
            setShowReviewForm(true);
            // Scroll to review section after a short delay
            setTimeout(() => {
                const reviewSection = document.getElementById('reviews-section');
                if (reviewSection) {
                    reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
        }
    }, [id, searchParams, isAuthenticated]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/products/${id}`);
            setProduct(response.data);
        } catch (err) {
            setError('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await api.get(`/reviews/product/${id}`);
            setReviews(response.data);
        } catch (err) {
            console.error('Failed to load reviews:', err);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setError('Please login to submit a review');
            return;
        }

        setReviewLoading(true);
        setError('');

        try {
            const response = await api.post('/reviews', {
                productId: id,
                rating: reviewData.rating,
                comment: reviewData.comment
            });

            if (response.data.review) {
                setSuccess('Review submitted successfully!');
                setReviewData({ rating: 5, comment: '' });
                setShowReviewForm(false);
                // Refresh reviews and product (to update rating)
                await fetchReviews();
                await fetchProduct();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setReviewLoading(false);
        }
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setAddingToCart(true);
        setError('');
        setSuccess('');

        const result = await addToCart(product._id, quantity);

        if (result.success) {
            setSuccess('Added to cart successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.message);
        }

        setAddingToCart(false);
    };

    if (loading) return <Loading />;
    if (error && !product) {
        return (
            <div className="container">
                <div className="alert alert-error">{error}</div>
            </div>
        );
    }
    if (!product) return <div className="container">Product not found</div>;

    return (
        <div className="container">
            <button
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
                style={{ marginBottom: '20px' }}
            >
                ← Back
            </button>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    {/* Product Image */}
                    <div>
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={`http://localhost:5000${product.images[0]}`}
                                alt={product.name}
                                style={{
                                    width: '100%',
                                    height: '400px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            style={{
                                width: '100%',
                                height: '400px',
                                backgroundColor: '#ecf0f1',
                                borderRadius: '8px',
                                display: product.images && product.images.length > 0 ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '48px',
                            }}
                        >
                            📦
                        </div>
                    </div>

                    {/* Product Details */}
                    <div>
                        <h1 style={{ marginBottom: '10px' }}>{product.name}</h1>

                        {product.category && (
                            <span
                                style={{
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    marginBottom: '15px',
                                    display: 'inline-block',
                                }}
                            >
                                {product.category}
                            </span>
                        )}

                        <div className="product-price" style={{ fontSize: '32px', margin: '20px 0' }}>
                            ₹{product.retailPrice.toLocaleString()}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
                                {product.description}
                            </p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p>
                                <strong>Stock:</strong>{' '}
                                <span style={{ color: product.stock > 0 ? '#27ae60' : '#e74c3c' }}>
                                    {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
                                </span>
                            </p>
                            {product.region && (
                                <p>
                                    <strong>Region:</strong> {product.region}
                                </p>
                            )}
                            {product.isLocalProduct && (
                                <span
                                    style={{
                                        backgroundColor: '#27ae60',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                    }}
                                >
                                    🌿 Local Product
                                </span>
                            )}
                        </div>

                        {success && <div className="alert alert-success">{success}</div>}
                        {error && <div className="alert alert-error">{error}</div>}

                        {/* Add to Cart */}
                        {product.stock > 0 && isCustomer && (
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={product.stock}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        style={{ width: '80px', padding: '10px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="btn btn-success"
                                    disabled={addingToCart}
                                    style={{ marginTop: '25px' }}
                                >
                                    {addingToCart ? 'Adding...' : '🛒 Add to Cart'}
                                </button>
                            </div>
                        )}

                        {!isAuthenticated && (
                            <button onClick={() => navigate('/login')} className="btn btn-primary">
                                Login to Purchase
                            </button>
                        )}

                        {product.stock === 0 && (
                            <div className="alert alert-warning">This product is currently out of stock</div>
                        )}

                        {/* Seller Info */}
                        {product.owner && (
                            <div
                                style={{
                                    marginTop: '30px',
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                }}
                            >
                                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Seller Information</h3>
                                <p>
                                    <strong>Shop:</strong> {product.owner.retailerInfo?.shopName || 'N/A'}
                                </p>
                                {product.owner.retailerInfo?.address && (
                                    <p>
                                        <strong>Address:</strong> {product.owner.retailerInfo.address}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Product Rating */}
                        {product.averageRating > 0 && (
                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                        {product.averageRating.toFixed(1)}
                                    </span>
                                    <div style={{ fontSize: '20px' }}>
                                        {renderStars(Math.round(product.averageRating))}
                                    </div>
                                    <span style={{ color: '#7f8c8d', fontSize: '14px' }}>
                                        ({product.numberOfReviews} {product.numberOfReviews === 1 ? 'review' : 'reviews'})
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews-section" className="card" style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Reviews & Ratings</h2>
                    {isAuthenticated && isCustomer && (
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="btn btn-primary"
                        >
                            {showReviewForm ? 'Cancel' : 'Write a Review'}
                        </button>
                    )}
                </div>

                {/* Review Form */}
                {showReviewForm && (
                    <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '15px' }}>Write Your Review</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    Rating *
                                </label>
                                <select
                                    value={reviewData.rating}
                                    onChange={(e) => setReviewData({ ...reviewData, rating: Number(e.target.value) })}
                                    style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', width: '100%', maxWidth: '200px' }}
                                    required
                                >
                                    <option value={5}>5 ⭐⭐⭐⭐⭐ Excellent</option>
                                    <option value={4}>4 ⭐⭐⭐⭐ Very Good</option>
                                    <option value={3}>3 ⭐⭐⭐ Good</option>
                                    <option value={2}>2 ⭐⭐ Fair</option>
                                    <option value={1}>1 ⭐ Poor</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    Your Review *
                                </label>
                                <textarea
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    placeholder="Share your experience with this product..."
                                    rows="4"
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                                    required
                                    maxLength={1000}
                                />
                                <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                                    {reviewData.comment.length}/1000 characters
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success"
                                disabled={reviewLoading}
                            >
                                {reviewLoading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                        <p style={{ fontSize: '18px', marginBottom: '10px' }}>No reviews yet</p>
                        <p>Be the first to review this product!</p>
                    </div>
                ) : (
                    <div>
                        {reviews.map((review) => (
                            <div
                                key={review._id}
                                style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #ecf0f1',
                                    marginBottom: '15px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <h4 style={{ marginBottom: '5px' }}>{review.user?.name || 'Anonymous'}</h4>
                                        <div style={{ fontSize: '18px', marginBottom: '5px' }}>
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <p style={{ color: '#555', lineHeight: '1.6' }}>{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;