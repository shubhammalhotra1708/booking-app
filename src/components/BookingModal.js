'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

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

  const timeSlots = [
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM'
  ];

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleBooking = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Handle booking submission
    console.log('Booking details:', {
      salon,
      service: selectedService,
      staff: selectedStaff,
      date: selectedDate,
      time: selectedTime,
      customer: customerDetails
    });
    
    setIsLoading(false);
    setStep(5);
  };

  const resetModal = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate('');
    setSelectedTime('');
    setCustomerDetails({ name: '', phone: '', email: '' });
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
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

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
                        {salon.services?.map((service) => (
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
                                <p className="text-body mb-2">{service.description}</p>
                                <div className="flex items-center text-caption">
                                  <ClockIcon className="h-4 w-4 mr-1" style={{ color: 'var(--foreground-muted)' }} />
                                  {service.duration}
                                </div>
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
                        ))}
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
                        {salon.staff?.map((staff) => (
                          <div
                            key={staff.id}
                            onClick={() => setSelectedStaff(staff)}
                            className={`card-interactive p-6 cursor-pointer transition-all ${
                              selectedStaff?.id === staff.id
                                ? 'ring-2 ring-blue-500'
                                : ''
                            }`}
                            style={{
                              border: selectedStaff?.id === staff.id 
                                ? '2px solid var(--accent-primary)' 
                                : '1px solid var(--border-light)',
                              background: selectedStaff?.id === staff.id 
                                ? 'rgba(14, 165, 233, 0.05)' 
                                : 'var(--background)'
                            }}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <img
                                  src={staff.image}
                                  alt={staff.name}
                                  className="w-20 h-20 rounded-full object-cover"
                                  style={{ boxShadow: 'var(--shadow-card)' }}
                                />
                                {selectedStaff?.id === staff.id && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" 
                                       style={{ background: 'var(--accent-primary)' }}>
                                    ✓
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="heading-sm mb-1">{staff.name}</h5>
                                <p className="text-body mb-2">{staff.experience}</p>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {staff.specialties.slice(0, 3).map((specialty, index) => (
                                    <span key={index} className="px-2 py-1 text-xs rounded-full"
                                          style={{ background: 'var(--background-tertiary)', color: 'var(--foreground-secondary)' }}>
                                      {specialty}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center">
                                  <StarIcon className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm font-medium ml-1">{staff.rating}</span>
                                  <span className="text-caption ml-2">• Next available: Today 2:00 PM</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
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
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 text-sm rounded-lg transition-all font-medium ${
                                selectedTime === time
                                  ? 'text-white'
                                  : 'hover:shadow-md'
                              }`}
                              style={{
                                border: selectedTime === time 
                                  ? '2px solid var(--accent-primary)' 
                                  : '1px solid var(--border-medium)',
                                background: selectedTime === time 
                                  ? 'var(--accent-primary)' 
                                  : 'var(--background)',
                                color: selectedTime === time 
                                  ? 'white' 
                                  : 'var(--foreground-secondary)',
                                boxShadow: selectedTime === time 
                                  ? 'var(--shadow-card)' 
                                  : 'var(--shadow-soft)'
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
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
                            ✉️ Email Address
                          </label>
                          <input
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                            className="input-booksy"
                            placeholder="your.email@example.com"
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
                        (step === 2 && !selectedStaff) ||
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
                      disabled={!customerDetails.name || !customerDetails.phone || !customerDetails.email || isLoading}
                      className="btn-primary ml-auto flex items-center"
                      style={{
                        opacity: !customerDetails.name || !customerDetails.phone || !customerDetails.email || isLoading ? 0.5 : 1,
                        cursor: !customerDetails.name || !customerDetails.phone || !customerDetails.email || isLoading ? 'not-allowed' : 'pointer'
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
