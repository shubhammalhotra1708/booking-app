'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Phone, 
  User 
} from 'lucide-react';

export default function BookingStatus({ session }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.token) {
      fetchBookings();
    }
  }, [session]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // For now, we'll use phone/email to find bookings
      // In production, you'd link bookings to the session token
      const searchField = session.phone ? 'customer_phone' : 'customer_email';
      const searchValue = session.phone || session.email;
      
      const response = await fetch(`/api/bookings?${searchField}=${searchValue}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const result = await response.json();
      setBookings(result.data || []);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
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

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return 'Your booking is being reviewed. You\'ll be notified once confirmed.';
      case 'confirmed':
        return 'Great! Your booking is confirmed. See you soon!';
      case 'completed':
        return 'Thank you for visiting us! Hope you enjoyed your service.';
      case 'cancelled':
        return 'This booking has been cancelled.';
      case 'rejected':
        return 'Unfortunately, this booking couldn\'t be accommodated.';
      default:
        return 'Booking status unknown.';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.name || 'Valued Customer'}!
        </h2>
        <p className="text-gray-600 mt-1">
          Here are your booking details and status updates
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">
            {session.isGuest 
              ? "Make your first booking to see it here!"
              : "You haven't made any bookings yet with this account."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className={`border rounded-lg p-4 ${getStatusColor(booking.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(booking.status)}
                  <span className="font-semibold capitalize">{booking.status}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Booking #{String(booking.id).padStart(6, '0')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="flex items-center space-x-2 text-gray-700 mb-2">
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
                  <div className="flex items-center space-x-2 text-gray-700 mb-2">
                    <Clock className="h-4 w-4" />
                    <span>{booking.booking_time}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-700 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{booking.Shop?.name}</span>
                  </div>
                  <div className="text-gray-700 mb-2">
                    <span className="font-medium">Service:</span> {booking.Service?.name}
                  </div>
                  {booking.Staff && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <User className="h-4 w-4" />
                      <span>with {booking.Staff.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white bg-opacity-50 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-gray-700">
                  {getStatusMessage(booking.status)}
                </p>
              </div>

              {booking.notes && (
                <div className="bg-white bg-opacity-50 rounded-md p-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Note:</span> {booking.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Book Another Appointment
        </button>
      </div>
    </div>
  );
}