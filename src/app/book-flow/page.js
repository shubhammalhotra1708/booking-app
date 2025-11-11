'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, User, Calendar, Check } from 'lucide-react';

export default function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const shopId = searchParams.get('shop_id');
  const serviceId = searchParams.get('service_id');
  const step = parseInt(searchParams.get('step') || '1');

  // State
  const [loading, setLoading] = useState(false);
  const [shop, setShop] = useState(null);
  const [service, setService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [staffForSlot, setStaffForSlot] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Load shop and service data
  useEffect(() => {
    const fetchData = async () => {
      if (!shopId || !serviceId) return;
      
      try {
        const [shopRes, serviceRes] = await Promise.all([
          fetch(`/api/shops?shop_id=${shopId}`),
          fetch(`/api/services?shop_id=${shopId}&service_id=${serviceId}`)
        ]);

        const shopData = await shopRes.json();
        const serviceData = await serviceRes.json();

        if (shopData.success && shopData.data.length > 0) {
          setShop(shopData.data[0]);
        }

        if (serviceData.success && serviceData.data.length > 0) {
          setService(serviceData.data[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [shopId, serviceId]);

  // Navigation helpers
  const goToStep = (newStep) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', newStep.toString());
    router.push(`/book-flow?${params.toString()}`);
  };

  const goBack = () => {
    if (step > 1) {
      goToStep(step - 1);
    } else {
      router.back();
    }
  };

  const goNext = () => {
    if (step < 4) {
      goToStep(step + 1);
    }
  };

  // Generate available dates (next 7 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        isToday: i === 0
      });
    }
    return dates;
  };

  // Fetch available slots
  const fetchAvailableSlots = async (date) => {
    if (!date || !shopId || !serviceId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/availability?shop_id=${shopId}&service_id=${serviceId}&date=${date}`
      );
      const data = await response.json();
      
      if (data.success && data.data?.availableSlots) {
        setAvailableSlots(data.data.availableSlots);
      } else {
        console.error('API Error:', data.error || 'No available slots found');
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedStaff(null);
    setAvailableSlots([]);
    setStaffForSlot([]);
    fetchAvailableSlots(date);
  };

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setSelectedStaff(null);
    setStaffForSlot(slot.availableStaff || []);
    goNext(); // Go to staff selection
  };

  // Handle staff selection
  const handleStaffSelect = (staff) => {
    setSelectedStaff(staff);
    goNext(); // Go to contact info
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!customerInfo.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(customerInfo.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (customerInfo.email && !/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle booking
  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        shop_id: parseInt(shopId),
        service_id: parseInt(serviceId),
        booking_date: selectedDate,
        booking_time: selectedSlot.time,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
      };

      if (selectedStaff) {
        bookingData.staff_id = selectedStaff.id;
      }

      if (customerInfo.email && customerInfo.email.trim()) {
        bookingData.customer_email = customerInfo.email;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to success page
        router.push(`/booking-success?booking_id=${data.data.id}`);
      } else {
        alert('Booking failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed: Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!shop || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-booksy">
          <div className="flex items-center justify-between h-16 py-3">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-semibold text-gray-800 hover:text-sky-500">
                BeautyBook
              </Link>
              <button
                onClick={goBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{service?.name || 'Service'}</h1>
              <p className="text-sm text-gray-600">{shop.name}</p>
            </div>
            <div className="w-24"></div> {/* Spacer */}
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-4 space-x-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-2 w-8 rounded-full ${
                  stepNum <= step ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
              <p className="text-gray-600">Choose when you'd like your appointment</p>
            </div>

            {/* Date Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Date</h3>
              <div className="grid grid-cols-7 gap-2">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.value}
                    onClick={() => handleDateSelect(date.value)}
                    className={`p-3 text-center rounded-lg border transition-all ${
                      selectedDate === date.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    } ${date.isToday ? 'ring-2 ring-blue-200' : ''}`}
                  >
                    <div className="text-xs font-medium">{date.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Times</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading available times...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotSelect(slot)}
                        className="p-3 text-center rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all bg-white"
                      >
                        <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                        <div className="text-sm font-medium">{slot.time}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {slot.availableStaff?.length || 0} staff
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No available slots for this date</p>
                    <p className="text-sm">Please choose another date</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Staff Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Staff Member</h2>
              <p className="text-gray-600">Select your preferred staff member</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Calendar className="h-4 w-4" />
                <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <Clock className="h-4 w-4 ml-4" />
                <span>{selectedSlot?.time}</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* No Preference Option */}
              <button
                onClick={() => handleStaffSelect(null)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left bg-white"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">No Preference</div>
                    <div className="text-sm text-gray-500">Any available staff member</div>
                  </div>
                  <div className="ml-auto">
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Staff Options */}
              {staffForSlot.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffSelect(staff)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{staff.name}</div>
                      <div className="text-sm text-gray-500">{typeof service === 'string' ? service : service?.name || 'Service'}</div>
                    </div>
                    <div className="ml-auto">
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Available
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
              <p className="text-gray-600">We need your details to confirm the booking</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  <Clock className="h-4 w-4 ml-4" />
                  <span>{selectedSlot?.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>with {selectedStaff?.name || 'any available staff'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: '' });
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    validationErrors.name 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your full name"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, phone: e.target.value });
                    if (validationErrors.phone) {
                      setValidationErrors({ ...validationErrors, phone: '' });
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    validationErrors.phone 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your phone number"
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: '' });
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    validationErrors.email 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email address"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!customerInfo.name || !customerInfo.phone || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}