'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, Phone, RefreshCw, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getCurrentUser, signOut, ensureCustomerRecord } from '@/lib/auth-helpers';
import { createClient } from '@/utils/supabase/client';
import { getCustomerBookings } from '@/actions/customers';

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

  useEffect(() => {
    checkAuthAndFetchBookings();
  }, []);

  // Deprecated: credentials banner removed; we now prompt to create password for temp accounts

  const checkAuthAndFetchBookings = async () => {
    try {
      setLoading(true);
      
      // Get current user from Supabase Auth
  const { user: authUser } = await getCurrentUser();
      
      if (!authUser) {
        router.push('/client-dashboard');
        return;
      }
      
      setUser(authUser);
      
      // Get or create customer record
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
      console.error('Error:', error);
      setError('Failed to load your bookings');
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
        {/* Finish account setup (password) for temp accounts */}
        {user?.user_metadata?.temp_account && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">🔐</div>
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">Finish account setup</div>
                <div className="text-sm text-blue-800">Create a password so you can sign in later.</div>
                <div className="mt-2 flex gap-2 items-center">
                  <input
                    type="password"
                    value={setupPwd}
                    onChange={(e) => setSetupPwd(e.target.value)}
                    placeholder="Create password"
                    className="p-2 border rounded w-64"
                  />
                  <button
                    onClick={handleFinishAccountSetup}
                    disabled={setupLoading}
                    className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    {setupLoading ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
                {setupError && <div className="text-red-600 text-sm mt-2">{setupError}</div>}
                {setupSuccess && <div className="text-green-700 text-sm mt-2">{setupSuccess}</div>}
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">
              {customer
                ? `Welcome back, ${customer.name || user?.email || 'Customer'}!`
                : user?.email
                ? `Welcome, ${user.email}`
                : 'Manage your appointments'}
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
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
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