'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  StarIcon, 
  MapPinIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { salonDetails } from '@/data/mockData';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = parseInt(params.id);
  const salon = salonDetails[salonId];

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [fieldWarnings, setFieldWarnings] = useState({});

  // Handle URL parameters for pre-selection
  useEffect(() => {
    if (!salon) return;

    // Pre-select staff from URL parameter
    const staffId = searchParams.get('staff');
    if (staffId) {
      const staff = salon.staff.find(s => s.id === parseInt(staffId));
      if (staff) {
        setSelectedStaff(staff);
      }
    }

    // Pre-select service from URL parameter
    const serviceId = searchParams.get('service');
    if (serviceId) {
      const service = salon.services.find(s => s.id === parseInt(serviceId));
      if (service) {
        setSelectedServices([service]);
      }
    }

    // If no staff is pre-selected but service is, suggest staff based on service
    if (serviceId && !staffId) {
      const service = salon.services.find(s => s.id === parseInt(serviceId));
      if (service) {
        // Find staff that specialize in this service type (basic matching)
        const suggestedStaff = salon.staff.find(staff => 
          staff.specialties.some(specialty => 
            service.name.toLowerCase().includes(specialty.toLowerCase()) ||
            specialty.toLowerCase().includes(service.name.toLowerCase())
          )
        );
        if (suggestedStaff) {
          setSelectedStaff(suggestedStaff);
        }
      }
    }
  }, [salon, searchParams]);

  // Generate next 7 days for date selection
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return dates;
  };

  // Generate time slots
  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'
  ];

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const handleBooking = () => {
    // Clear previous warnings
    setFieldWarnings({});
    
    // Check for missing fields and set specific warnings
    const warnings = {};
    
    if (selectedServices.length === 0) {
      warnings.services = 'Please select at least one service';
    }
    
    if (!selectedStaff) {
      warnings.staff = 'Please select a staff member or choose "No Preference"';
    }
    
    if (!selectedDate) {
      warnings.date = 'Please select a date for your appointment';
    }
    
    if (!selectedTime) {
      warnings.time = 'Please select a time slot';
    }
    
    if (!customerDetails.name.trim()) {
      warnings.name = 'Please enter your full name';
    }
    
    if (!customerDetails.email.trim()) {
      warnings.email = 'Please enter your email address';
    }
    
    if (!customerDetails.phone.trim()) {
      warnings.phone = 'Please enter your phone number';
    }
    
    // If there are warnings, show them and return
    if (Object.keys(warnings).length > 0) {
      setFieldWarnings(warnings);
      // Scroll to first warning (services section)
      document.querySelector('.booking-form')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    // All fields are valid, proceed with booking
    alert('Booking confirmed! You will receive a confirmation email shortly.');
    router.push(`/salon/${salonId}`);
  };

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Salon not found</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/salon/${salonId}`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Book Appointment</h1>
                <p className="text-sm text-gray-600">{salon.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4" />
              <span>{salon.address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6 booking-form">
            
            {/* Step 1: Select Services */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                Select Services
              </h2>
              <p className="text-sm text-gray-600 mb-4">You can select multiple services for your appointment</p>
              {fieldWarnings.services && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldWarnings.services}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salon.services.map((service) => {
                  const isSelected = selectedServices.find(s => s.id === service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceToggle(service)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2 pr-6">
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <span className="text-lg font-bold text-gray-900">₹{service.price}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{service.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Staff */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                Select Staff Member
              </h2>
              <p className="text-sm text-gray-600 mb-4">Choose a specific staff member or let us assign the best available one</p>
              {fieldWarnings.staff && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldWarnings.staff}
                  </p>
                </div>
              )}
              
              {/* No Preference Option */}
              <div className="mb-4">
                <div
                  onClick={() => setSelectedStaff('no-preference')}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedStaff === 'no-preference'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">No Preference</h3>
                      <p className="text-sm text-gray-600">We'll assign the best available staff member</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salon.staff.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedStaff?.id === staff.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={staff.image}
                        alt={staff.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{staff.name}</h3>
                        <p className="text-sm text-gray-600">{staff.experience}</p>
                        <div className="flex items-center mt-1">
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{staff.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Specialties: {staff.specialties.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Select Date & Time */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
                Select Date & Time
              </h2>
              
              {/* Date Selection */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2" />
                  Choose Date
                </h3>
                {fieldWarnings.date && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldWarnings.date}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {generateDates().map((dateObj) => (
                    <button
                      key={dateObj.date}
                      onClick={() => setSelectedDate(dateObj.date)}
                      className={`p-3 text-center rounded-lg border transition-all ${
                        selectedDate === dateObj.date
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{dateObj.display}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Choose Time
                </h3>
                {fieldWarnings.time && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldWarnings.time}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 text-center rounded-lg border transition-all text-sm ${
                        selectedTime === time
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Customer Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">4</span>
                Your Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldWarnings.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {fieldWarnings.name && (
                    <p className="mt-1 text-sm text-red-600">{fieldWarnings.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldWarnings.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {fieldWarnings.phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldWarnings.phone}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldWarnings.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {fieldWarnings.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldWarnings.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={salon.images[0]}
                    alt={salon.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{salon.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span>{salon.rating} ({salon.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {selectedServices.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">Selected Services:</p>
                      {selectedServices.map((service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <div>
                            <p className="text-gray-900">{service.name}</p>
                            <p className="text-gray-600">{service.duration}</p>
                          </div>
                          <p className="font-medium text-gray-900">₹{service.price}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedStaff && (
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {selectedStaff === 'no-preference' ? 'No preference (any available staff)' : `with ${selectedStaff.name}`}
                      </span>
                    </div>
                  )}

                  {selectedDate && selectedTime && (
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {selectedTime}
                      </span>
                    </div>
                  )}
                </div>

                {selectedServices.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">₹{calculateTotal()}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleBooking}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Confirm Booking
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                You will receive a confirmation email after booking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}