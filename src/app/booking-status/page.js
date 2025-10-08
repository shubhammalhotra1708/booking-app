'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  Clock, 
  X,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  Search,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';

export default function BookingStatusPage() {
  const searchParams = useSearchParams();
  const urlBookingId = searchParams.get('booking_id');
  const urlPhone = searchParams.get('phone');
  const urlEmail = searchParams.get('email');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchForm, setSearchForm] = useState({
    bookingId: urlBookingId || '',
    phone: urlPhone || '',
    email: urlEmail || ''
  });
  const [showSearchForm, setShowSearchForm] = useState(!urlBookingId || (!urlPhone && !urlEmail));
  const [lastRefresh, setLastRefresh] = useState(null);

  const searchBooking = async () => {
    if (!searchForm.bookingId || (!searchForm.phone && !searchForm.email)) {
      setError('Please provide booking ID and either phone number or email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        booking_id: searchForm.bookingId,
        ...(searchForm.phone && { phone: searchForm.phone }),
        ...(searchForm.email && { email: searchForm.email })
      });

      const response = await fetch(`/api/bookings?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.data);
        setShowSearchForm(false);
      } else {
        setError(data.error || 'Booking not found or credentials do not match');
        setBooking(null);
      }
    } catch (err) {
      setError('Failed to fetch booking details');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { color: 'yellow', icon: Clock, text: 'Pending Confirmation' },
      confirmed: { color: 'green', icon: CheckCircle, text: 'Confirmed' },
      completed: { color: 'blue', icon: CheckCircle, text: 'Completed' },
      cancelled: { color: 'red', icon: X, text: 'Cancelled' },
      rejected: { color: 'red', icon: X, text: 'Rejected' },
      no_show: { color: 'gray', icon: AlertCircle, text: 'No Show' }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Auto-refresh booking status every 30 seconds
  useEffect(() => {
    let refreshInterval;
    
    if (booking && (searchForm.phone || searchForm.email)) {
      refreshInterval = setInterval(async () => {
        try {
          const params = new URLSearchParams({
            booking_id: searchForm.bookingId,
            ...(searchForm.phone && { phone: searchForm.phone }),
            ...(searchForm.email && { email: searchForm.email })
          });

          const response = await fetch(`/api/bookings?${params.toString()}`);
          const data = await response.json();

          if (data.success) {
            if (data.data.status !== booking.status) {
              // Status changed - update booking and show notification
              setBooking(data.data);
              
              // Show a brief notification
              const statusInfo = getStatusInfo(data.data.status);
              const notification = document.createElement('div');
              notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all';
              notification.textContent = `✅ Status updated: ${statusInfo.text}`;
              document.body.appendChild(notification);
              
              setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => document.body.removeChild(notification), 300);
              }, 4000);
            }
            setLastRefresh(new Date());
          }
        } catch (error) {
          console.error('Error refreshing booking status:', error);
        }
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [booking, searchForm.bookingId, searchForm.phone, searchForm.email]);

  useEffect(() => {
    if (urlBookingId && (urlPhone || urlEmail) && !booking) {
      // Auto-search if we have booking ID and contact info from URL
      searchBooking();
    } else if (urlBookingId && !booking) {
      setSearchForm(prev => ({ 
        ...prev, 
        bookingId: urlBookingId,
        phone: urlPhone || '',
        email: urlEmail || ''
      }));
    }
  }, [urlBookingId, urlPhone, urlEmail, booking]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container-booksy">
          <div className="flex items-center justify-between h-16 py-3">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-semibold text-gray-800 hover:text-sky-500">
                BeautyBook
              </Link>
              <div className="flex items-center text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="text-sm">Back to Home</span>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Booking Status</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search Form */}
        {showSearchForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center mb-6">
              <Search className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Booking</h2>
              <p className="text-gray-600">Enter your booking details to check the status</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking ID *
                </label>
                <input
                  type="text"
                  value={searchForm.bookingId}
                  onChange={(e) => setSearchForm({ ...searchForm, bookingId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your booking ID (e.g., 19)"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={searchForm.phone}
                    onChange={(e) => setSearchForm({ ...searchForm, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={searchForm.email}
                    onChange={(e) => setSearchForm({ ...searchForm, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your email address"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={searchBooking}
                disabled={loading || !searchForm.bookingId || (!searchForm.phone && !searchForm.email)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Searching...' : 'Find My Booking'}
              </button>

              <div className="text-xs text-gray-500 text-center space-y-2">
                <p>* You need either phone number or email that was used during booking</p>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-blue-700 font-medium">💡 Where to find your Booking ID?</p>
                  <p className="text-blue-600">• Check your SMS confirmation message</p>
                  <p className="text-blue-600">• Look in your email confirmation (if provided)</p>
                  <p className="text-blue-600">• It was shown on the booking confirmation page</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details */}
        {booking && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {(() => {
                    const { color, icon: StatusIcon, text } = getStatusInfo(booking.status);
                    const colorClasses = {
                      yellow: 'bg-yellow-100 text-yellow-600',
                      green: 'bg-green-100 text-green-600',
                      blue: 'bg-blue-100 text-blue-600',
                      red: 'bg-red-100 text-red-600',
                      gray: 'bg-gray-100 text-gray-600'
                    };
                    
                    return (
                      <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                        <StatusIcon className="h-8 w-8" />
                      </div>
                    );
                  })()}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Booking #{booking.id}
                </h2>
                <p className="text-lg text-gray-600">
                  {getStatusInfo(booking.status).text}
                </p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">Date</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.booking_time?.substring(0, 5)} 
                      {booking.duration && ` (${booking.duration} min)`}
                    </p>
                    <p className="text-sm text-gray-600">Time & Duration</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.Staff ? booking.Staff.name : 'Any available staff'}
                    </p>
                    <p className="text-sm text-gray-600">Staff Member</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{booking.Shop?.name}</p>
                    <p className="text-sm text-gray-600">{booking.Service?.name}</p>
                  </div>
                </div>
              </div>

              {booking.total_amount && (
                <div className="border-t mt-6 pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${booking.total_amount}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900">{booking.customer_name}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900">{booking.customer_phone}</span>
                </div>
                
                {booking.customer_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">{booking.customer_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-refresh Status */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Auto-refreshing every 30 seconds</span>
                </div>
                {lastRefresh && (
                  <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={async () => {
                  setLoading(true);
                  await searchBooking();
                  setLoading(false);
                }}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh Status'}
              </button>
              <button
                onClick={() => setShowSearchForm(true)}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Search Another Booking
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!booking && showSearchForm && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
            <p className="text-blue-800 mb-4">
              Can't find your booking? Here are some tips:
            </p>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• Check your SMS for the booking confirmation with ID</li>
              <li>• Make sure you're using the same phone number used for booking</li>
              <li>• Booking ID is usually a number like 19, 20, etc.</li>
              <li>• Contact the salon directly if you're still having issues</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
