'use client';

import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Calendar, Clock, User, Star } from 'lucide-react';

export default function BookingModal({ isOpen, onClose, salon }) {
  const [step, setStep] = useState(1); // 1: Service, 2: Staff, 3: DateTime, 4: Details, 5: Confirmation
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch services when modal opens
  useEffect(() => {
    if (isOpen && salon?.id) {
      fetchServices();
    }
  }, [isOpen, salon?.id]);

  // Fetch staff when service is selected
  useEffect(() => {
    if (selectedService?.id && salon?.id) {
      fetchStaff();
    }
  }, [selectedService?.id, salon?.id]);

  // Set default date when reaching step 3
  useEffect(() => {
    if (step === 3 && !selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [step, selectedDate]);

  // Fetch availability when date/service/staff is selected
  useEffect(() => {
    if (selectedService?.id && selectedDate && salon?.id) {
      fetchAvailability();
    }
  }, [selectedService?.id, selectedDate, selectedStaff?.id, salon?.id]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?shop_id=${salon.id}`);
      const result = await response.json();
      if (result.success) {
        setServices(result.data);
      } else {
        setError('Failed to load services');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching services:', error);
      }
      setError('Unable to load available services. Please try again.');
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/staff?shop_id=${salon.id}&service_id=${selectedService.id}`);
      const result = await response.json();
      if (result.success) {
        setStaff(result.data);
      } else {
        setError('Failed to load staff');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching staff:', error);
      }
      setError('Unable to load available staff. Please try again.');
    }
  };

  const fetchAvailability = async () => {
    setAvailabilityLoading(true);
    try {
      const params = new URLSearchParams({
        shop_id: salon.id,
        service_id: selectedService.id,
        date: selectedDate
      });
      
      if (selectedStaff?.id) {
        params.append('staff_id', selectedStaff.id);
      }

      const response = await fetch(`/api/availability?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setAvailableSlots(result.data.availableSlots || []);
        setBlockedSlots(result.data.blockedSlots || []);
        
        // Show helpful message if no available slots
        if (!result.data.availableSlots?.length && result.data.blockedSlots?.length) {
          setError('All time slots are booked. Red slots show existing bookings.');
        } else if (!result.data.availableSlots?.length) {
          setError('No time slots available for this date.');
        } else {
          setError(null); // Clear any previous errors
        }
      } else {
        setError('Failed to load availability');
        setAvailableSlots([]);
        setBlockedSlots([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load availability');
      setAvailableSlots([]);
      setBlockedSlots([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleBooking = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert 12-hour time format to 24-hour for API
      const time24 = convertTo24Hour(selectedTime);
      
      // 🔥 REAL-TIME VALIDATION: Double-check availability before booking
      const availabilityParams = new URLSearchParams({
        shop_id: salon.id,
        service_id: selectedService.id,
        date: selectedDate
      });
      
      if (selectedStaff?.id) {
        availabilityParams.append('staff_id', selectedStaff.id);
      }
      
      const availabilityResponse = await fetch(`/api/availability?${availabilityParams}`);
      const availabilityResult = await availabilityResponse.json();
      
      if (availabilityResult.success) {
        const selectedSlotStillAvailable = availabilityResult.data.availableSlots?.some(slot => 
          slot.time === time24.substring(0, 5) && // Match HH:MM format
          (!selectedStaff?.id || slot.availableStaff.some(staff => staff.id === selectedStaff.id))
        );
        
        if (!selectedSlotStillAvailable) {
          setError(`Sorry, the ${selectedTime} time slot is no longer available${selectedStaff ? ` for ${selectedStaff.name}` : ''}. Please select a different time.`);
          // Refresh available slots
          fetchAvailability();
          setIsLoading(false);
          return;
        }
      }
      
      const bookingData = {
        shop_id: salon.id,
        service_id: selectedService.id,
        staff_id: selectedStaff?.id || null,
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        customer_email: customerDetails.email || null,
        booking_date: selectedDate,
        booking_time: time24,
        notes: customerDetails.notes || null
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (result.success) {
        // Create automatic session for the customer
        const sessionToken = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const clientSession = {
          token: sessionToken,
          phone: customerDetails.phone,
          email: customerDetails.email,
          name: customerDetails.name,
          createdAt: new Date().toISOString(),
          bookings: [result.data.id], // Add this booking ID
          isAutoCreated: true // Flag to indicate this was auto-created during booking
        };
        
        // Only create session if one doesn't already exist
        const existingSession = localStorage.getItem('clientSession');
        if (!existingSession) {
          localStorage.setItem('clientSession', JSON.stringify(clientSession));
        } else {
          // Update existing session with new booking
          try {
            const existing = JSON.parse(existingSession);
            existing.bookings = [...(existing.bookings || []), result.data.id];
            localStorage.setItem('clientSession', JSON.stringify(existing));
          } catch (e) {
            // If parsing fails, create new session
            localStorage.setItem('clientSession', JSON.stringify(clientSession));
          }
        }
        
        setStep(5); // Move to confirmation step
      } else {
        // Enhanced error handling for different conflict types
        if (response.status === 409) {
          setError(`This time slot was just booked by someone else! Please choose a different time.`);
          // Refresh available slots to show current availability
          fetchAvailability();
        } else {
          setError(result.error || result.message || 'Failed to create booking');
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert 12-hour to 24-hour format
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours) + 12;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  // Helper function to convert 24-hour to 12-hour format
  const convertTo12Hour = (time24h) => {
    const [hours, minutes] = time24h.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const modifier = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${modifier}`;
  };

  const resetModal = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(''); // Will be set to today when step 3 is reached
    setSelectedTime('');
    setCustomerDetails({ name: '', phone: '', email: '', notes: '' });
    setServices([]);
    setStaff([]);
    setAvailableSlots([]);
    setBlockedSlots([]);
    setError(null);
  };

  const stepTitles = [
    { number: 1, title: 'Choose Service', icon: '✨' },
    { number: 2, title: 'Select Staff', icon: '👤' },
    { number: 3, title: 'Pick Date & Time', icon: '📅' },
    { number: 4, title: 'Your Details', icon: '📝' },
    { number: 5, title: 'Confirmation', icon: '✅' }
  ];

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {stepTitles.map((stepItem, index) => (
          <div key={stepItem.number} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
              step >= stepItem.number 
                ? 'text-white' 
                : 'text-gray-400'
            }`} style={{
              background: step >= stepItem.number ? 'var(--accent-primary)' : 'var(--background-tertiary)',
              boxShadow: step === stepItem.number ? 'var(--shadow-card)' : 'none'
            }}>
              {step > stepItem.number ? '✓' : stepItem.icon}
            </div>
            {index < stepTitles.length - 1 && (
              <div className={`w-8 md:w-16 h-0.5 mx-2 transition-colors ${
                step > stepItem.number ? 'bg-blue-500' : 'bg-gray-200'
              }`} style={{
                background: step > stepItem.number ? 'var(--accent-primary)' : 'var(--border-light)'
              }} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <h3 className="heading-md">{stepTitles[step - 1]?.title}</h3>
        <p className="text-caption mt-1">Step {step} of {stepTitles.length}</p>
      </div>
    </div>
  );

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!salon) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden bg-white text-left align-middle transition-all card-booksy" style={{ boxShadow: 'var(--shadow-modal)' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <Dialog.Title as="h3" className="heading-md">
                      Book Appointment
                    </Dialog.Title>
                    <p className="text-body mt-1">{salon.name}</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="px-6 pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-red-400">⚠️</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                          <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Steps */}
                <div className="px-6 py-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <StepIndicator />
                </div>

                {/* Content */}
                <div className="p-8 min-h-[500px]">
                  {step === 1 && (
                    <div className="animate-fade-in">
                      <div className="text-center mb-8">
                        <h4 className="heading-md mb-2">Select Your Service</h4>
                        <p className="text-body">Choose from our professional beauty services</p>
                      </div>
                      <div className="grid gap-4 max-h-96 overflow-y-auto">
                        {services.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-caption mt-2">Loading services...</p>
                          </div>
                        ) : (
                          services.map((service) => (
                            <div
                              key={service.id}
                              onClick={() => setSelectedService(service)}
                              className={`card-interactive p-6 cursor-pointer transition-all ${
                                selectedService?.id === service.id
                                  ? 'ring-2 ring-blue-500'
                                  : ''
                              }`}
                              style={{
                                border: selectedService?.id === service.id 
                                  ? '2px solid var(--accent-primary)' 
                                  : '1px solid var(--border-light)',
                                background: selectedService?.id === service.id 
                                  ? 'rgba(14, 165, 233, 0.05)' 
                                  : 'var(--background)'
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="heading-sm mb-2">{service.name}</h5>
                                  <p className="text-body mb-2">{service.description || 'Professional service'}</p>
                                  <div className="flex items-center text-caption">
                                    <Clock className="h-4 w-4 mr-1" style={{ color: 'var(--foreground-muted)' }} />
                                    {service.duration} minutes
                                  </div>
                                  {service.category && (
                                    <div className="mt-2">
                                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                        {service.category}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>₹{service.price}</p>
                                  {selectedService?.id === service.id && (
                                    <div className="mt-2">
                                      <span className="status-info">✓ Selected</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="animate-fade-in">
                      <div className="text-center mb-8">
                        <h4 className="heading-md mb-2">Choose Your Stylist</h4>
                        <p className="text-body">Select from our experienced professionals</p>
                      </div>
                      <div className="grid gap-4 max-h-96 overflow-y-auto">
                        {staff.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-caption mt-2">Loading available staff...</p>
                          </div>
                        ) : (
                          staff.map((staffMember) => (
                            <div
                              key={staffMember.id}
                              onClick={() => setSelectedStaff(staffMember)}
                              className={`card-interactive p-6 cursor-pointer transition-all ${
                                selectedStaff?.id === staffMember.id
                                  ? 'ring-2 ring-blue-500'
                                  : ''
                              }`}
                              style={{
                                border: selectedStaff?.id === staffMember.id 
                                  ? '2px solid var(--accent-primary)' 
                                  : '1px solid var(--border-light)',
                                background: selectedStaff?.id === staffMember.id 
                                  ? 'rgba(14, 165, 233, 0.05)' 
                                  : 'var(--background)'
                              }}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-600"
                                       style={{ boxShadow: 'var(--shadow-card)' }}>
                                    👤
                                  </div>
                                  {selectedStaff?.id === staffMember.id && (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" 
                                         style={{ background: 'var(--accent-primary)' }}>
                                      ✓
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h5 className="heading-sm mb-1">{staffMember.name}</h5>
                                  <p className="text-body mb-2">{staffMember.role}</p>
                                  {staffMember.experience && (
                                    <p className="text-caption mb-2">{staffMember.experience}</p>
                                  )}
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {staffMember.specialties?.slice(0, 3).map((specialty, index) => (
                                      <span key={index} className="px-2 py-1 text-xs rounded-full"
                                            style={{ background: 'var(--background-tertiary)', color: 'var(--foreground-secondary)' }}>
                                        {specialty}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400" />
                                    <span className="text-sm font-medium ml-1">{staffMember.rating || '4.5'}</span>
                                    <span className="text-caption ml-2">• Available today</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        
                        {/* Option to skip staff selection */}
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedStaff(null);
                              handleNext();
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Skip - Let salon assign staff →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="animate-fade-in">
                      <div className="text-center mb-8">
                        <h4 className="heading-md mb-2">Pick Date & Time</h4>
                        <p className="text-body">Choose your preferred appointment slot</p>
                      </div>
                      
                      {/* Date Selection */}
                      <div className="mb-8">
                        <label className="block heading-sm mb-3">
                          📅 Select Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="input-booksy text-lg"
                        />
                      </div>

                      {/* Time Selection */}
                      <div>
                        <label className="block heading-sm mb-3">
                          ⏰ Select Time
                        </label>
                        {availabilityLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-caption mt-2">Loading available times...</p>
                          </div>
                        ) : (availableSlots.length === 0 && blockedSlots.length === 0) ? (
                          <div className="text-center py-8">
                            <p className="text-body">No time slots available for this date.</p>
                            <p className="text-caption mt-1">Please select a different date.</p>
                          </div>
                        ) : (
                          <>
                            {/* Legend */}
                            <div className="flex gap-4 text-xs text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span>Available</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                                <span>Booked</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                            {/* Combine and sort all slots by time */}
                            {[...availableSlots.map(slot => ({...slot, isAvailable: true})), 
                              ...blockedSlots.map(slot => ({...slot, isAvailable: false}))]
                               .sort((a, b) => a.time.localeCompare(b.time))
                               .map((slot) => {
                              const time12h = convertTo12Hour(slot.time);
                              return (
                                <button
                                  key={slot.time}
                                  onClick={() => {
                                    if (slot.isAvailable) {
                                      setSelectedTime(time12h);
                                      // If no staff selected yet and slot has available staff, auto-select first one
                                      if (!selectedStaff && slot.availableStaff.length > 0) {
                                        setSelectedStaff(slot.availableStaff[0]);
                                      }
                                    }
                                  }}
                                  disabled={!slot.isAvailable}
                                  className={`p-3 text-sm rounded-lg transition-all font-medium relative ${
                                    !slot.isAvailable
                                      ? 'cursor-not-allowed opacity-75 bg-red-50 border-red-200 text-red-600'
                                      : selectedTime === time12h
                                      ? 'text-white bg-blue-500 border-blue-500'
                                      : 'hover:shadow-md hover:bg-blue-50 border-gray-300'
                                  }`}
                                  style={{
                                    border: !slot.isAvailable
                                      ? '1px solid #fecaca'
                                      : selectedTime === time12h 
                                      ? '2px solid var(--accent-primary)' 
                                      : '1px solid var(--border-medium)',
                                    background: !slot.isAvailable
                                      ? '#fef2f2'
                                      : selectedTime === time12h 
                                      ? 'var(--accent-primary)' 
                                      : 'var(--background)',
                                    color: !slot.isAvailable
                                      ? '#dc2626'
                                      : selectedTime === time12h 
                                      ? 'white' 
                                      : 'var(--foreground-secondary)',
                                    boxShadow: selectedTime === time12h 
                                      ? 'var(--shadow-card)' 
                                      : 'var(--shadow-soft)'
                                  }}
                                  title={!slot.isAvailable && slot.blockedStaff?.length > 0
                                    ? `Booked by: ${slot.blockedStaff.map(s => s.bookingDetails?.customer || 'Customer').join(', ')}`
                                    : ''
                                  }
                                >
                                  {time12h}
                                  {slot.isAvailable && slot.availableStaff?.length > 0 && (
                                    <div className="text-xs mt-1 opacity-75">
                                      {slot.availableStaff.length} staff available
                                    </div>
                                  )}
                                  {!slot.isAvailable && (
                                    <div className="text-xs mt-1 opacity-75">
                                      Booked
                                    </div>
                                  )}
                                  {!slot.isAvailable && (
                                    <div className="absolute top-1 right-1">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="animate-fade-in">
                      <div className="text-center mb-8">
                        <h4 className="heading-md mb-2">Your Details</h4>
                        <p className="text-body">We'll use this information to confirm your appointment</p>
                      </div>
                      <div className="space-y-6 max-w-md mx-auto">
                        <div>
                          <label className="block heading-sm mb-3">
                            👤 Full Name
                          </label>
                          <input
                            type="text"
                            value={customerDetails.name}
                            onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                            className="input-booksy"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block heading-sm mb-3">
                            📱 Phone Number
                          </label>
                          <input
                            type="tel"
                            value={customerDetails.phone}
                            onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                            className="input-booksy"
                            placeholder="+91 9876543210"
                          />
                        </div>
                        <div>
                          <label className="block heading-sm mb-3">
                            ✉️ Email Address (Optional)
                          </label>
                          <input
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                            className="input-booksy"
                            placeholder="your.email@example.com"
                          />
                        </div>
                        <div>
                          <label className="block heading-sm mb-3">
                            📝 Special Requests (Optional)
                          </label>
                          <textarea
                            value={customerDetails.notes || ''}
                            onChange={(e) => setCustomerDetails({...customerDetails, notes: e.target.value})}
                            className="input-booksy"
                            rows={3}
                            placeholder="Any special requests or notes for your appointment..."
                          />
                        </div>
                        
                        {/* Privacy Notice */}
                        <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--background-tertiary)' }}>
                          <p className="text-caption text-center">
                            🔒 Your information is secure and will only be used for appointment confirmation
                          </p>
                        </div>
                      </div>

                      {/* Enhanced Booking Summary */}
                      <div className="mt-8 card-booksy p-6" style={{ background: 'var(--background-secondary)' }}>
                        <h5 className="heading-sm mb-4 text-center">📋 Booking Summary</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-body">Service:</span>
                            <span className="font-semibold">{selectedService?.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-body">Staff:</span>
                            <span className="font-semibold">{selectedStaff?.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-body">Date:</span>
                            <span className="font-semibold">{selectedDate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-body">Time:</span>
                            <span className="font-semibold">{selectedTime}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 mt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                            <span className="heading-sm">Total:</span>
                            <span className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>₹{selectedService?.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="text-center animate-scale-in">
                      <div className="mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" 
                             style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                          <span className="text-3xl">🎉</span>
                        </div>
                        <h4 className="heading-lg mb-3">Booking Confirmed!</h4>
                        <p className="text-body text-lg">Your appointment has been successfully booked</p>
                      </div>
                      
                      {/* Confirmation Details */}
                      <div className="card-booksy p-6 text-left max-w-md mx-auto mb-6">
                        <h5 className="heading-sm mb-4 text-center">📄 Appointment Details</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-body">Booking ID:</span>
                            <span className="font-mono text-sm">#BK{Date.now().toString().slice(-6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body">Salon:</span>
                            <span className="font-semibold">{salon.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body">Service:</span>
                            <span className="font-semibold">{selectedService?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body">Stylist:</span>
                            <span className="font-semibold">{selectedStaff?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body">Date & Time:</span>
                            <span className="font-semibold">{selectedDate} at {selectedTime}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-caption">
                        📱 Confirmation details sent to {customerDetails.email}
                      </p>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        Booking Confirmed!
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Your appointment has been successfully booked. 
                        You will receive a confirmation message shortly.
                      </p>
                      <div className="text-sm text-gray-600">
                        <p>Booking ID: #BK{Date.now()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6" style={{ borderTop: '1px solid var(--border-light)', background: 'var(--background-secondary)' }}>
                  {step > 1 && step < 5 && (
                    <button
                      onClick={handleBack}
                      className="btn-ghost"
                    >
                      ← Back
                    </button>
                  )}
                  
                  {step < 4 && (
                    <button
                      onClick={handleNext}
                      disabled={
                        (step === 1 && !selectedService) ||
                        (step === 3 && (!selectedDate || !selectedTime))
                      }
                      className="ml-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  )}
                  
                  {step === 4 && (
                    <button
                      onClick={handleBooking}
                      disabled={!customerDetails.name || !customerDetails.phone || isLoading}
                      className="btn-primary ml-auto flex items-center"
                      style={{
                        opacity: !customerDetails.name || !customerDetails.phone || isLoading ? 0.5 : 1,
                        cursor: !customerDetails.name || !customerDetails.phone || isLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        '🎉 Confirm Booking'
                      )}
                    </button>
                  )}
                  
                  {step === 5 && (
                    <button
                      onClick={handleClose}
                      className="ml-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
