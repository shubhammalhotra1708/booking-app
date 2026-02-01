'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

/**
 * Feedback Submission Page
 * Allows customers to submit reviews after their service
 */
export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState(null)
  
  // Form state
  const [shopRating, setShopRating] = useState(0)
  const [staffRating, setStaffRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoveredShopStar, setHoveredShopStar] = useState(0)
  const [hoveredStaffStar, setHoveredStaffStar] = useState(0)
  
  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/reviews/verify?token=${token}`)
        const result = await res.json()
        
        if (!result.success || !result.valid) {
          setError(result.error || 'Invalid review link')
        } else {
          setData(result.data)
        }
      } catch (err) {
        setError('Failed to load review page')
      } finally {
        setLoading(false)
      }
    }
    
    if (token) {
      verifyToken()
    }
  }, [token])
  
  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault()
    
    if (shopRating === 0) {
      setError('Please rate your experience')
      return
    }
    
    setSubmitting(true)
    setError(null)
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          shop_rating: shopRating,
          staff_rating: data.canRateStaff ? staffRating : null,
          comment: comment.trim() || null
        })
      })
      
      const result = await res.json()
      
      if (!result.success) {
        setError(result.error || 'Failed to submit review')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  // Star rating component
  function StarRating({ rating, setRating, hovered, setHovered, size = 'large' }) {
    const starSize = size === 'large' ? 'w-10 h-10' : 'w-8 h-8'
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`${starSize} transition-transform hover:scale-110`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={(hovered || rating) >= star ? '#f59e0b' : 'none'}
              stroke={(hovered || rating) >= star ? '#f59e0b' : '#d1d5db'}
              strokeWidth="1.5"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
      </div>
    )
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your feedback helps us improve and helps others find great services.</p>
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill={shopRating >= star ? '#f59e0b' : '#e5e7eb'}
              >
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            ))}
          </div>
          <p className="text-sm text-gray-500">You rated {data?.shop?.name} {shopRating} stars</p>
        </div>
      </div>
    )
  }

  // Feedback form
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          {data.shop?.logo && (
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-gray-100">
              <Image
                src={data.shop.logo}
                alt={data.shop.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            How was your visit?
          </h1>
          <p className="text-gray-600 mt-1">
            at <span className="font-medium">{data.shop?.name}</span>
          </p>
          {data.serviceName && (
            <p className="text-sm text-teal-600 mt-1">{data.serviceName}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Rating */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rate your overall experience
            </label>
            <div className="flex justify-center">
              <StarRating
                rating={shopRating}
                setRating={setShopRating}
                hovered={hoveredShopStar}
                setHovered={setHoveredShopStar}
                size="large"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {shopRating === 0 ? 'Tap to rate' :
               shopRating === 1 ? 'Poor' :
               shopRating === 2 ? 'Fair' :
               shopRating === 3 ? 'Good' :
               shopRating === 4 ? 'Very Good' : 'Excellent'}
            </p>
          </div>

          {/* Staff Rating (if applicable) */}
          {data.canRateStaff && data.staff && (
            <div className="text-center border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate {data.staff.name}
              </label>
              <div className="flex justify-center">
                <StarRating
                  rating={staffRating}
                  setRating={setStaffRating}
                  hovered={hoveredStaffStar}
                  setHovered={setHoveredStaffStar}
                  size="small"
                />
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your experience (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you liked or what could be improved..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900"
            />
            <p className="text-xs text-gray-500 text-right mt-1">
              {comment.length}/1000
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || shopRating === 0}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Your feedback is valuable and helps improve service quality
        </p>
      </div>
    </div>
  )
}

