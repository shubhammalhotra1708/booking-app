'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, User, Phone, RefreshCw, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getCurrentUser, signOut, ensureCustomerRecord } from '@/lib/auth-helpers';
import { createClient } from '@/utils/supabase/client';
import { getCustomerBookings } from '@/actions/customers';
import { logger } from '@/lib/logger';

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [newCreds, setNewCreds] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'pending', 'confirmed'

  useEffect(() => {
    checkAuthAndFetchBookings();
  }, []);

  // Deprecated: credentials banner removed; we now prompt to create password for temp accounts

  const checkAuthAndFetchBookings = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Get current user from Supabase Auth (includes anonymous users)
      const { user: authUser } = await getCurrentUser();
      
      if (!authUser) {
        // No session at all - redirect to login page
        router.push('/client-dashboard');
        return;
      }
      
      setUser(authUser);
      
      // Check if user is anonymous
      const isAnonymous = authUser.user_metadata?.anonymous || 
                         authUser.app_metadata?.provider === 'anonymous' ||
                         !authUser.email;
      
      logger.debug('My Bookings - User status:', { 
        id: authUser.id, 
        isAnonymous,
        email: authUser.email 
      });
      
      // Get or create customer record (works for both anonymous and permanent users)
      const ensureRes = await ensureCustomerRecord();
      const customerData = ensureRes?.success ? ensureRes.data : null;

      if (!customerData) {
        setError('Failed to load customer profile');
        setLoading(false);
        return;
      }
      
      setCustomer(customerData);
      
      // Fetch bookings by customer_id
      const bookingsData = await getCustomerBookings(customerData.id);
      setBookings(bookingsData);
      
    } catch (error) {
      logger.error('Error loading bookings:', error);
      
      // Check if it's a network error
      if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Failed to load your bookings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkAuthAndFetchBookings();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    const { success } = await signOut();
    if (success) {
      router.push('/');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
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
        {/* Welcome message for verified users */}
        {user && !user.user_metadata?.anonymous && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">✓</div>
              <div className="flex-1">
                <div className="font-semibold text-green-900 mb-1">Welcome back!</div>
                <div className="text-sm text-green-800">
                  Logged in as <span className="font-medium">{customer?.email || user.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info for anonymous/guest users */}
        {user?.user_metadata?.anonymous && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">ℹ️</div>
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">Guest Booking</div>
                <div className="text-sm text-blue-800">
                  You're viewing bookings as a guest. To access them anytime, <a href="/client-dashboard" className="underline font-medium">create an account</a> or sign in.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">
              {(() => {
                const email = user?.email || '';
                const isPhoneAlias = email.endsWith('@phone.local');
                const fallbackLabel = isPhoneAlias ? 'Customer' : (email || 'Customer');
                if (customer) {
                  return `Welcome back, ${customer.name || fallbackLabel}!`;
                }
                if (user?.email) {
                  return `Welcome, ${fallbackLabel}`;
                }
                return 'Manage your appointments';
              })()}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
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
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-red-800 font-medium">Unable to load bookings</div>
                <div className="text-red-600 text-sm mt-1">{error}</div>
              </div>
              <button
                onClick={checkAuthAndFetchBookings}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-sm flex items-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
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
                      <span>{booking.booking_time?.slice(0, 5) || booking.booking_time}</span>
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
                      <span className="font-medium text-lg text-gray-900">₹{booking.Service.price}</span>
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