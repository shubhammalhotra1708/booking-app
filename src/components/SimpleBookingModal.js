'use client';

import { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, MapPin } from 'lucide-react';

export default function SimpleBookingModal({ 
  isOpen, 
  onClose, 
  selectedShop, 
  selectedService,
  onBookingSuccess 
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [staffForSlot, setStaffForSlot] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Staff, 3: Contact Info, 4: Confirm
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Generate next 7 days
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

  // Fetch available slots for selected date
  const fetchAvailableSlots = async (date) => {
    if (!date || !selectedShop?.id || !selectedService?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/availability?shop_id=${selectedShop.id}&service_id=${selectedService.id}&date=${date}`
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

  // Fetch staff available for selected slot
  const fetchStaffForSlot = async (slot) => {
    if (!selectedDate || !selectedShop?.id || !selectedService?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/staff-availability?shop_id=${selectedShop.id}&service_id=${selectedService.id}&date=${selectedDate}&time=${slot}`
      );
      const data = await response.json();
      
      if (data.success && data.data?.staff) {
        setStaffForSlot(data.data.staff);
      } else {
        setStaffForSlot([]);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setStaffForSlot([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedStaff(null);
    setStaffForSlot([]);
    fetchAvailableSlots(date);
  };

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setSelectedStaff(null);
    // Set the staff directly from the slot data (Booksy-style)
    setStaffForSlot(slot.availableStaff || []);
    setStep(2);
  };

  // Handle staff selection
  const handleStaffSelect = (staff) => {
    setSelectedStaff(staff); // staff can be null for "No Preference"
    setStep(3);
  };

  // Handle booking confirmation
  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !customerInfo.name || !customerInfo.phone) {
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        shop_id: selectedShop.id,
        service_id: selectedService.id,
        booking_date: selectedDate,
        booking_time: selectedSlot.time,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
      };

      // Add staff_id only if a staff member is selected
      if (selectedStaff) {
        bookingData.staff_id = selectedStaff.id;
      }

      // Add email only if provided
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
        onBookingSuccess?.(data.data);
        onClose();
      } else {
        alert('Booking failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset modal when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDate('');
      setSelectedSlot(null);
      setSelectedStaff(null);
      setAvailableSlots([]);
      setStaffForSlot([]);
      setCustomerInfo({ name: '', email: '', phone: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedService?.name} at {selectedShop?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Step 1: Date & Time Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h3>
                
                {/* Date Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Choose Date</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-3">Available Times</label>
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
                            className="p-3 text-center rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
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
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No available slots for this date</p>
                        <p className="text-sm">Please choose another date</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Staff Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Choose Staff Member</h3>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to time selection
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-blue-800">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  <Clock className="h-4 w-4 ml-4" />
                  <span>{selectedSlot?.time}</span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-2">Finding available staff...</p>
                </div>
              ) : staffForSlot.length > 0 ? (
                <div className="space-y-3">
                  {/* No Preference Option */}
                  <button
                    onClick={() => handleStaffSelect(null)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">No Preference</div>
                        <div className="text-sm text-gray-500">
                          Any available staff member
                        </div>
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
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{staff.name}</div>
                          <div className="text-sm text-gray-500">
                            {staff.specialization || 'General Services'}
                          </div>
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
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No specific staff available for this time slot</p>
                    <p className="text-sm">But you can still book - any available staff will help you</p>
                  </div>
                  <button
                    onClick={() => handleStaffSelect(null)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue with Any Staff
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Information</h3>
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to staff selection
                </button>
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
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
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
    </div>
  );
}