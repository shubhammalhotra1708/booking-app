'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, MapPin, User, Phone, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function MyBookings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [userSession, setUserSession] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'pending', 'confirmed'

  useEffect(() => {
    // Check for user session
    const savedSession = localStorage.getItem('clientSession');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        const sessionAge = new Date() - new Date(parsedSession.createdAt);
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (sessionAge < maxAge) {
          setUserSession(parsedSession);
          fetchBookings(parsedSession);
        } else {
          localStorage.removeItem('clientSession');
          redirectToLogin();
        }
      } catch (error) {
        localStorage.removeItem('clientSession');
        redirectToLogin();
      }
    } else {
      // Check for email param (from booking confirmation)
      const email = searchParams.get('email');
      if (email) {
        fetchBookingsByEmail(email);
      } else {
        redirectToLogin();
      }
    }
  }, [searchParams]);

  const redirectToLogin = () => {
    router.push('/client-dashboard');
  };

  const fetchBookings = async (session) => {
    try {
      setLoading(true);
      setError('');
      
      const searchField = session.phone ? 'customer_phone' : 'customer_email';
      const searchValue = session.phone || session.email;
      
      const response = await fetch(`/api/bookings?${searchField}=${encodeURIComponent(searchValue)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const result = await response.json();
      setBookings(result.data || []);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsByEmail = async (email) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/bookings?customer_email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const result = await response.json();
      setBookings(result.data || []);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userSession) {
      await fetchBookings(userSession);
    } else {
      const email = searchParams.get('email');
      if (email) {
        await fetchBookingsByEmail(email);
      }
    }
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const filterBookings = (bookings, filter) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(b => b.booking_date >= today && !['cancelled', 'rejected', 'completed'].includes(b.status));
      case 'past':
        return bookings.filter(b => b.booking_date < today || b.status === 'completed');
      case 'pending':
        return bookings.filter(b => b.status === 'pending');
      case 'confirmed':
        return bookings.filter(b => b.status === 'confirmed');
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings(bookings, filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showCompactSearch={true} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-6 border">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showCompactSearch={true} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Bookings
            </h1>
            <p className="text-gray-600 mt-1">
              {userSession ? `Welcome back, ${userSession.name}!` : 'Manage your appointments'}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'past', label: 'Past' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No bookings found' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't made any bookings yet." 
                : `You don't have any ${filter} appointments.`
              }
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className={`bg-white rounded-lg border p-6 transition-all hover:shadow-md ${getStatusColor(booking.status)}`}
              >
                {/* Booking Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(booking.status)}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {booking.Service?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Booking #{booking.id.toString().slice(-6)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-white rounded-full border capitalize">
                    {booking.status}
                  </span>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {new Date(booking.booking_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="h-4 w-4" />
                      <span>{booking.booking_time}</span>
                      <span className="text-sm text-gray-500">
                        ({booking.Service?.duration} min)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{booking.Shop?.name}</span>
                    </div>
                    {booking.Staff && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <User className="h-4 w-4" />
                        <span>with {booking.Staff.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="bg-white bg-opacity-50 rounded-md p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Note:</span> {booking.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {booking.Service?.price && (
                      <span className="font-medium">₹{booking.Service.price}</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/booking-status?id=${booking.id}`)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                    {booking.status === 'pending' && (
                      <button
                        onClick={handleRefresh}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Check Status
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}