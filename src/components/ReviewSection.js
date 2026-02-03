'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, PenLine, LogIn } from 'lucide-react';

/**
 * ReviewSection Component
 * Displays reviews for a shop with real API data
 * Allows logged-in users to submit reviews
 *
 * Props:
 * - shopId: The shop ID to fetch reviews for
 * - shopName: Shop name for display
 * - initialReviews: Optional pre-fetched reviews
 * - initialStats: Optional pre-fetched stats
 */
export default function ReviewSection({ shopId, shopName = '', initialReviews = [], initialStats = null }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats || {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(!initialReviews.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = checking, true/false = result

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch reviews from API
  const fetchReviews = useCallback(async (currentOffset = 0, append = false) => {
    if (!shopId) return;

    try {
      const res = await fetch(`/api/reviews?shop_id=${shopId}&limit=${LIMIT}&offset=${currentOffset}`);
      const data = await res.json();

      if (data.success) {
        if (append) {
          setReviews(prev => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews || []);
        }

        setStats({
          averageRating: data.stats?.averageRating || 0,
          totalReviews: data.stats?.totalReviews || 0,
          distribution: data.stats?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });

        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [shopId]);

  // Initial fetch
  useEffect(() => {
    if (!initialReviews.length && shopId) {
      fetchReviews(0);
    }
  }, [shopId, initialReviews.length, fetchReviews]);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(!!data.user);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  // Load more reviews
  const handleLoadMore = async () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    setLoadingMore(true);
    await fetchReviews(newOffset, true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate rating distribution percentages
  const getRatingDistribution = () => {
    const dist = stats.distribution;
    const total = stats.totalReviews || 1;

    return [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: dist[stars] || 0,
      percentage: total > 0 ? Math.round(((dist[stars] || 0) / total) * 100) : 0
    }));
  };

  // Submit review handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shopId,
          shop_rating: reviewRating,
          comment: reviewComment.trim() || null
        })
      });

      const result = await res.json();

      if (!result.success) {
        setSubmitError(result.error || 'Failed to submit review');
      } else {
        setSubmitSuccess(true);
        setShowReviewForm(false);
        // Refresh reviews
        fetchReviews(0);
        // Reset form
        setReviewRating(0);
        setReviewComment('');
      }
    } catch (err) {
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Ratings</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const ratingDistribution = getRatingDistribution();

  // Handle login redirect
  const handleLoginRedirect = () => {
    const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '';
    router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h3>
        {!showReviewForm && !submitSuccess && (
          isLoggedIn === null ? (
            // Still checking auth
            <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse" />
          ) : isLoggedIn ? (
            // User is logged in - show Write a Review button
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              <PenLine className="h-4 w-4" />
              Write a Review
            </button>
          ) : (
            // User is NOT logged in - show Login prompt
            <button
              onClick={handleLoginRedirect}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
            >
              <LogIn className="h-4 w-4" />
              Log in to Review
            </button>
          )
        )}
      </div>

      {/* Success message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-700 font-medium">Thank you for your review! 🎉</p>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-4">
            Share your experience{shopName ? ` at ${shopName}` : ''}
          </h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        (hoveredStar || reviewRating) >= star
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reviewRating === 0 ? 'Tap to rate' :
                 reviewRating === 1 ? 'Poor' :
                 reviewRating === 2 ? 'Fair' :
                 reviewRating === 3 ? 'Good' :
                 reviewRating === 4 ? 'Very Good' : 'Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell others about your experience..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900"
              />
              <p className="text-xs text-gray-500 text-right">{reviewComment.length}/500</p>
            </div>

            {/* Error */}
            {submitError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {submitError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || reviewRating === 0}
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewRating(0);
                  setReviewComment('');
                  setSubmitError(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Overall Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left side - Overall rating */}
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${
                  star <= Math.floor(stats.averageRating)
                    ? 'text-yellow-400 fill-current'
                    : star <= stats.averageRating
                    ? 'text-yellow-400 fill-current opacity-50'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-gray-600">Based on {stats.totalReviews} reviews</p>
        </div>

        {/* Right side - Rating distribution */}
        <div className="space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.stars} className="flex items-center">
              <span className="text-sm text-gray-600 w-8">{item.stars}★</span>
              <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* No reviews message */}
      {reviews.length === 0 && (
        <div className="text-center py-8 border-t">
          <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-6 border-t pt-6">
          <h4 className="text-lg font-semibold">Customer Reviews</h4>
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-semibold">
                    {(review.reviewer_name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-gray-900">
                          {review.reviewer_name || 'Anonymous'}
                        </h5>
                        {review.is_verified_customer && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                    {review.Staff?.name && (
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                        with {review.Staff.name}
                      </span>
                    )}
                  </div>

                  {review.title && (
                    <h6 className="font-medium text-gray-800 mb-1">{review.title}</h6>
                  )}

                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Owner Response */}
                  {review.owner_response && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-teal-200 bg-gray-50 p-3 rounded-r-lg">
                      <p className="text-sm font-medium text-teal-700 mb-1">Response from owner</p>
                      <p className="text-sm text-gray-600">{review.owner_response}</p>
                      {review.owner_response_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(review.owner_response_at)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Reviews */}
      {hasMore && reviews.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </div>
  );
}
