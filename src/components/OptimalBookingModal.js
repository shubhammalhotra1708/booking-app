'use client'

import { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  User, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export default function OptimalBookingModal({ 
  isOpen, 
  onClose, 
  selectedShop, 
  selectedService,
  onBookingSuccess 
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
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

  // Fetch available time slots with staff information
  const fetchAvailableSlots = async (date) => {
    if (!date || !selectedShop?.id || !selectedService?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `/api/availability?shop_id=${selectedShop.id}&service_id=${selectedService.id}&date=${date}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.availableSlots) {
        // Transform the data to show time slots with available staff
        const slotMap = new Map();
        
        result.data.availableSlots.forEach(slot => {
          const timeKey = slot.time;
          if (!slotMap.has(timeKey)) {
            slotMap.set(timeKey, {
              time: slot.time,
              displayTime: slot.displayTime || slot.time,
              availableStaff: []
            });
          }
          
          slotMap.get(timeKey).availableStaff.push({
            id: slot.staff_id,
            name: slot.staff_name || 'Staff Member',
            slot_id: slot.slot_id
          });
        });
        
        // Convert to array and sort by time
        const sortedSlots = Array.from(slotMap.values()).sort((a, b) => 
          a.time.localeCompare(b.time)
        );
        
        setAvailableSlots(sortedSlots);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load available times. Please try again.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, selectedShop, selectedService]);

  // Handle booking
  const handleBookSlot = async (timeSlot, staffMember) => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('Please fill in all customer information fields');
      return;
    }

    setBookingInProgress(true);
    setError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: selectedShop.id,
          service_id: selectedService.id,
          staff_id: staffMember.id,
          booking_date: selectedDate,
          booking_time: timeSlot.time,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          notes: '',
          status: 'confirmed'
        }),
      });

      const result = await response.json();

      if (result.success) {
        onBookingSuccess?.(result.data);
        onClose();
        // Reset form
        setCustomerInfo({ name: '', email: '', phone: '' });
        setSelectedDate('');
        setAvailableSlots([]);
      } else {
        setError(result.message || 'Booking failed. Please try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Booking failed. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Book Your Appointment</h2>
            <p className="text-gray-600 mt-1">
              <span className="font-medium text-blue-600">{selectedService?.name}</span> at <span className="font-medium">{selectedShop?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Step 1: Select Date */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
              Choose Date
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getAvailableDates().map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={`p-3 text-sm border-2 rounded-xl transition-all transform hover:scale-105 ${
                    selectedDate === date.value
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="font-semibold">{date.label}</div>
                  {date.isToday && (
                    <div className="text-xs opacity-75 mt-1">Today</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Customer Information */}
          {selectedDate && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
                Your Information
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Available Time Slots */}
          {selectedDate && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</span>
                Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mb-4"></div>
                  <span className="text-gray-600 font-medium">Loading available times...</span>
                  <span className="text-gray-400 text-sm mt-1">This may take a moment</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No available times for this date.</p>
                  <p className="text-sm">Please try a different date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableSlots.map((timeSlot, index) => (
                    <div
                      key={index}
                      className="border-2 border-gray-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-bold text-xl text-gray-900">{timeSlot.displayTime}</span>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {timeSlot.availableStaff.length} staff available
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        {timeSlot.availableStaff.map((staff) => (
                          <button
                            key={staff.id}
                            onClick={() => handleBookSlot(timeSlot, staff)}
                            disabled={bookingInProgress}
                            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-100 group-hover:bg-green-100 rounded-full p-2 transition-colors">
                                <User className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{staff.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {bookingInProgress ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-500"></div>
                              ) : (
                                <div className="bg-green-100 rounded-full p-1">
                                  <Check className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {selectedDate && availableSlots.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">How to book:</p>
                  <p>1. Fill in your information above</p>
                  <p>2. Click on any available staff member to book instantly</p>
                  <p>3. You'll receive a confirmation email</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}