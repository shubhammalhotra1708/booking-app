'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, User, Phone, RefreshCw, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getCurrentUser, signOut, ensureCustomerRecord, upgradeAnonymousAccount } from '@/lib/auth-helpers';
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
  const [setupPwd, setSetupPwd] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'pending', 'confirmed'
  
  // Anonymous account upgrade
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePwd, setUpgradePwd] = useState('');
  const [upgradeName, setUpgradeName] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');

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
        // No session at all - redirect to homepage
        router.push('/');
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
  const handleFinishAccountSetup = async () => {
    setSetupError('');
    setSetupSuccess('');
    if (setupPwd.length < 6) {
      setSetupError('Password must be at least 6 characters.');
      return;
    }
    try {
      setSetupLoading(true);
      const supa = createClient();
      const { error } = await supa.auth.updateUser({
        password: setupPwd,
        data: { ...(user?.user_metadata || {}), temp_account: false },
      });
      if (error) throw error;
      setSetupSuccess('Password set successfully. You can use it to sign in later.');
      // refresh user state
      const refreshed = await getCurrentUser();
      setUser(refreshed.user);
    } catch (e) {
      setSetupError(e.message || 'Failed to set password');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleUpgradeAccount = async () => {
    if (!setupPwd) {
      setUpgradeError('Password is required');
      return;
    }
    if (setupPwd.length < 6) {
      setUpgradeError('Password must be at least 6 characters');
      return;
    }
    
    // Use customer data from booking (email already provided during booking)
    const email = customer?.email;
    if (!email) {
      setUpgradeError('Email not found. Please contact support.');
      return;
    }
    
    setUpgradeLoading(true);
    setUpgradeError('');
    setUpgradeSuccess('');
    
    try {
      const result = await upgradeAnonymousAccount({
        email: email,
        password: setupPwd,
        name: customer?.name || 'Customer',
        phone: customer?.phone || null
      });
      
      if (!result.success) {
        setUpgradeError(result.error || 'Failed to upgrade account');
        return;
      }
      
      setUpgradeSuccess('Account created! You can now sign in with your email.');
      
      // Refresh to show updated user state
      setTimeout(() => {
        checkAuthAndFetchBookings();
      }, 1500);
      
    } catch (error) {
      logger.error('Upgrade error:', error);
      setUpgradeError(error.message || 'Failed to create account');
    } finally {
      setUpgradeLoading(false);
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

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
        {/* Finish account setup (password) for anonymous users */}
        {user?.user_metadata?.anonymous && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">🔐</div>
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">Save your booking details</div>
                <div className="text-sm text-blue-800 mb-2">
                  Create a password for <span className="font-medium">{customer?.email || 'your account'}</span> to access your bookings anytime.
                </div>
                <div className="mt-2 flex gap-2 items-center flex-wrap">
                  <input
                    type="password"
                    value={setupPwd}
                    onChange={(e) => setSetupPwd(e.target.value)}
                    placeholder="Create password (6+ chars)"
                    className="p-2 border rounded flex-1 min-w-[200px]"
                  />
                  <button
                    onClick={handleUpgradeAccount}
                    disabled={upgradeLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium whitespace-nowrap"
                  >
                    {upgradeLoading ? 'Saving...' : 'Create Account'}
                  </button>
                </div>
                {upgradeError && (
                  <div className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {upgradeError}
                  </div>
                )}
                {upgradeSuccess && (
                  <div className="text-green-700 text-sm mt-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {upgradeSuccess}
                  </div>
                )}
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
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-1">
                      {booking.Service?.name}
                    </h3>
                    {/* Salon name - clickable */}
                    {booking.Shop && (
                      <Link 
                        href={`/salon/${booking.Shop.id}`}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 hover:underline group"
                      >
                        <MapPin className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{booking.Shop.name}</span>
                      </Link>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadgeColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                {/* Booking Details - Reordered for clarity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    {/* Date & Time - Bold and prominent */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center space-x-2 text-gray-900 mb-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-base">
                          {new Date(booking.booking_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-base">{booking.booking_time?.slice(0, 5) || booking.booking_time}</span>
                        <span className="text-sm text-gray-600 font-normal">
                          ({booking.Service?.duration} min)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {booking.Staff && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>with <span className="font-medium">{booking.Staff.name}</span></span>
                      </div>
                    )}
                    {booking.Service?.price && (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">₹{booking.Service.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Note:</span> {booking.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}