'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Calendar, Clock, User, MapPin, Phone, Mail } from 'lucide-react';

export default function BookingSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      
      try {
        const response = await fetch(`/api/bookings?booking_id=${bookingId}`);
        const data = await response.json();
        
        if (data.success) {
          setBooking(data.data);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-4">We couldn't find the booking you're looking for.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container-booksy">
          <div className="flex items-center justify-between h-16 py-3">
            <Link href="/" className="text-xl font-semibold text-gray-800 hover:text-sky-500">
              BeautyBook
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Booking Confirmed</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your appointment has been successfully booked.</p>
        </div>

        {/* Booking ID - Prominent Display */}
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Your Booking ID</h2>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <span className="text-3xl font-bold text-blue-600">#{String(booking.id).padStart(6, '0')}</span>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              📝 Save this ID to check your booking status anytime
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
          
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
                  {booking.booking_time?.substring(0, 5)} ({booking.duration} min)
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

          <div className="border-t mt-6 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">
                ${booking.total_amount}
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
          
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

        {/* Next Steps */}
        <div className="bg-green-50 rounded-lg p-6 mb-6 border border-green-200">
          <h2 className="text-lg font-semibold text-green-900 mb-3">What's Next?</h2>
          <ul className="space-y-2 text-green-800">
            <li>• <strong>Save your Booking ID #{String(booking.id).padStart(6, '0')}</strong> - you'll need it to check status</li>
            <li>• You'll receive an SMS confirmation shortly</li>
            <li>• We'll send you a reminder 24 hours before your appointment</li>
            <li>• If you need to cancel or reschedule, please call the salon</li>
            <li>• Arrive 10 minutes early for your appointment</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
          <Link
            href={`/booking-status?booking_id=${booking.id}&phone=${encodeURIComponent(booking.customer_phone)}`}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            View Booking Status
          </Link>
        </div>
      </div>
    </div>
  );
}