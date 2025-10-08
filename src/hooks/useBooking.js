// Complete booking workflow hooks
'use client';

import { useState } from 'react';

// Hook for creating bookings
export const useCreateBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create booking');
        return null;
      }

      setSuccess(true);
      setBookingId(result.data.id);
      return result.data;

    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setError(null);
    setSuccess(false);
    setBookingId(null);
  };

  return { createBooking, loading, error, success, bookingId, resetBooking };
};

// Hook for checking booking status
export const useBookingStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  const checkBookingStatus = async (bookingId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings?booking_id=${bookingId}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch booking');
        return null;
      }

      setBooking(result.data[0]);
      return result.data[0];

    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { checkBookingStatus, booking, loading, error };
};

// Hook for customer booking history
export const useCustomerBookings = (customerEmail) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    if (!customerEmail) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings?customer_email=${encodeURIComponent(customerEmail)}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch bookings');
        return;
      }

      setBookings(result.data || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { fetchBookings, bookings, loading, error };
};

// Transform booking data for UI display
export const transformBookingData = (booking) => {
  if (!booking) return null;

  return {
    id: booking.id,
    shopName: booking.Shop?.name || 'Unknown Shop',
    shopPhone: booking.Shop?.phone || '',
    serviceName: booking.Service?.name || 'Unknown Service',
    staffName: booking.Staff?.name || 'Any Staff',
    date: booking.booking_date,
    time: booking.booking_time,
    duration: booking.Service?.duration || 30,
    price: booking.Service?.price || booking.total_amount,
    status: booking.status,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    specialRequests: booking.special_requests,
    notes: booking.notes,
    createdAt: booking.created_at,
    confirmedAt: booking.confirmed_at,
    // Status display
    statusColor: getStatusColor(booking.status),
    statusText: getStatusText(booking.status),
    canCancel: booking.status === 'pending' || booking.status === 'confirmed',
    isPending: booking.status === 'pending',
    isConfirmed: booking.status === 'confirmed',
    isCompleted: booking.status === 'completed',
    isRejected: booking.status === 'rejected'
  };
};

// Helper functions
const getStatusColor = (status) => {
  const colors = {
    pending: 'yellow',
    confirmed: 'green',
    rejected: 'red',
    completed: 'blue',
    cancelled: 'gray',
    no_show: 'orange'
  };
  return colors[status] || 'gray';
};

const getStatusText = (status) => {
  const texts = {
    pending: 'Pending Approval',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show'
  };
  return texts[status] || status;
};

// Booking form validation
export const validateBookingForm = (formData) => {
  const errors = {};

  if (!formData.customer_name?.trim()) {
    errors.customer_name = 'Name is required';
  }

  if (!formData.customer_email?.trim()) {
    errors.customer_email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
    errors.customer_email = 'Please enter a valid email';
  }

  if (!formData.customer_phone?.trim()) {
    errors.customer_phone = 'Phone number is required';
  } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.customer_phone)) {
    errors.customer_phone = 'Please enter a valid phone number';
  }

  if (!formData.booking_date) {
    errors.booking_date = 'Please select a date';
  } else {
    const selectedDate = new Date(formData.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.booking_date = 'Please select a future date';
    }
  }

  if (!formData.booking_time) {
    errors.booking_time = 'Please select a time';
  }

  if (!formData.service_id) {
    errors.service_id = 'Please select a service';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};