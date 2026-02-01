'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';

/**
 * ReviewSection Component
 * Displays reviews for a shop with real API data
 *
 * Props:
 * - shopId: The shop ID to fetch reviews for
 * - initialReviews: Optional pre-fetched reviews
 * - initialStats: Optional pre-fetched stats
 */
export default function ReviewSection({ shopId, initialReviews = [], initialStats = null }) {
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h3>
      </div>

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
