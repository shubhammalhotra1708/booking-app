'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, User, Calendar, Check } from 'lucide-react';
import { signUpWithEmail, getCurrentUser, ensureCustomerRecord } from '@/lib/auth-helpers';

function BookingFlowInner() {
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
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date to avoid "date in past" errors
    // Use local date, not UTC to avoid timezone issues
  const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    if (process.env.NODE_ENV !== 'production') {
      console.log('🗓️ Initializing selectedDate to:', todayString);
    }
    return todayString;
  });
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
  const [authPrefilled, setAuthPrefilled] = useState(false);
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [autoAdvancedToday, setAutoAdvancedToday] = useState(false);

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

  // Auto-fetch slots when date is set and we're on step 1
  useEffect(() => {
    if (selectedDate && step === 1 && shopId && serviceId) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📡 Fetching slots for date:', selectedDate);
      }
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, step, shopId, serviceId]);

  // If user is already logged in, prefill step 3 with known info
  useEffect(() => {
    const prefillFromAuth = async () => {
      if (step !== 3 || authPrefilled) return;
      const { user: authUser } = await getCurrentUser();
      if (authUser) {
        setLoggedIn(true);
        setCustomerInfo(ci => ({
          name: ci.name || authUser.user_metadata?.name || '',
          email: ci.email || authUser.email || '',
          phone: ci.phone || authUser.user_metadata?.phone || ''
        }));
        setAuthPrefilled(true);
        // ensure customer exists in background for smoother booking
        try { await ensureCustomerRecord(); } catch {}
      }
    };
    prefillFromAuth();
  }, [step, authPrefilled]);

  // Navigation helpers
  const goToStep = (newStep) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', newStep.toString());
    router.push(`/book-flow?${params.toString()}`);
  };

  const goBack = () => {
    if (step > 1) {
      goToStep(step - 1);
    } else if (shopId) {
      router.push(`/salon/${shopId}/book`);
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
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateValue = `${year}-${month}-${day}`;
      
      dates.push({
        value: dateValue,
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

        // If selected date is today and there are no available slots after filtering,
        // auto-advance to the next day once.
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        if (date === todayStr && data.data.availableSlots.length === 0 && !autoAdvancedToday) {
          const nextDay = new Date(today);
          nextDay.setDate(today.getDate() + 1);
          const nYYYY = nextDay.getFullYear();
          const nMM = String(nextDay.getMonth() + 1).padStart(2, '0');
          const nDD = String(nextDay.getDate()).padStart(2, '0');
          const nextDateStr = `${nYYYY}-${nMM}-${nDD}`;
          setAutoAdvancedToday(true);
          setSelectedDate(nextDateStr);
          // Trigger fetch for the next day
          await fetchAvailableSlots(nextDateStr);
          return;
        }
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
    // Reset auto-advance whenever user changes date explicitly
    setAutoAdvancedToday(false);
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
      setBookingError('');
      // Step 1: Check if user is already logged in
  let customerId = null;
  let { user: authUser } = await getCurrentUser();
      
      // Guard: sometimes session is created but not yet visible to getCurrentUser()
      // Poll for a short window before deciding to create a new account
      const waitForSession = async (retries = 6, delayMs = 250) => {
        for (let i = 0; i < retries; i++) {
          const { user } = await getCurrentUser();
          if (user) return user;
          await new Promise((res) => setTimeout(res, delayMs));
        }
        return null;
      };
      if (!authUser) {
        const maybeUser = await waitForSession();
        if (maybeUser) authUser = maybeUser;
      }
      
      if (authUser) {
        // User logged in, ensure their customer record exists (client-side)
        const customerRes = await ensureCustomerRecord();
        if (customerRes?.success) {
          customerId = customerRes.data.id;
          console.log('✅ Using/created customer:', customerId);
        } else {
          console.warn('⚠️ Could not ensure customer record:', customerRes?.error);
        }
      } else {
        // Step 2: User not logged in - create account for them
        console.log('👤 Creating new user account...');
        
        // Generate random password for the user
        const randomPassword = Math.random().toString(36).slice(-8) + 'Ab1!';
        
        const signupResult = await signUpWithEmail({
          email: customerInfo.email || `${customerInfo.phone}@phone.local`,
          password: randomPassword,
          name: customerInfo.name,
          phone: customerInfo.phone,
          tempAccount: true
        });

        if (signupResult.success && signupResult.data.user) {
          console.log('✅ User created successfully');
          // After signup, wait briefly for session to materialize
          authUser = await waitForSession();
          
          // Ensure the customer exists (client-side with session)
          const customerRes = await ensureCustomerRecord({
            name: customerInfo.name,
            email: customerInfo.email || `${customerInfo.phone}@phone.local`,
            phone: customerInfo.phone,
          });
          if (customerRes?.success) {
            customerId = customerRes.data.id;
            console.log('✅ Customer record created:', customerId);
            
            // No longer store or show generated password. We'll ask user to
            // set their own password via a banner on My Bookings (temp_account=true)
          } else {
            console.error('❌ Could not create Customer. Please try again.');
            alert('Could not create your profile. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          console.error('❌ Could not create user account', signupResult.error);
          const errMsg = signupResult.error || '';
          if (errMsg.includes('already registered')) {
            setBookingError('An account with this email already exists. Please sign in above.');
          } else {
            setBookingError('We could not create your account. Please sign in or try another email.');
          }
          setLoading(false);
          return;
        }
      }

      // Ensure we have a customerId before creating booking
      if (!customerId) {
        alert('We could not verify your account. Please sign in and try again.');
        setLoading(false);
        return;
      }

      // Step 3: Create booking (requires customer_id)
      const bookingData = {
        shop_id: parseInt(shopId),
        service_id: parseInt(serviceId),
        booking_date: selectedDate,
        booking_time: selectedSlot.time,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_id: customerId,
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

      if (response.ok && data.success) {
        // Step 4: Always redirect to My Bookings (user is signed in now)
        router.push(`/my-bookings?highlight=${data.data.id}`);
      } else {
        if (response.status === 409 || (data.error || '').toLowerCase().includes('time slot')) {
          setBookingError('That time was just taken. Please pick a different slot.');
        } else if (response.status === 404) {
          setBookingError('Service or staff is unavailable for this shop. Please try another option.');
        } else {
          setBookingError(data.error || 'Booking failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError('Booking failed: Network error');
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
                BookEz
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
            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {bookingError}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
              <p className="text-gray-600">We need your details to confirm the booking</p>
            </div>

            {/* Inline sign in option */}
            {!loggedIn && (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">Already have an account?</div>
                  <button
                    onClick={() => { setShowInlineLogin(!showInlineLogin); setLoginError(''); }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {showInlineLogin ? 'Hide sign in' : 'Sign in to auto-fill'}
                  </button>
                </div>
                {showInlineLogin && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={async () => {
                        setLoginError('');
                        const { signInWithEmail } = await import('@/lib/auth-helpers');
                        const result = await signInWithEmail({ email: loginForm.email, password: loginForm.password });
                        if (!result.success) {
                          setLoginError(result.error || 'Sign in failed');
                          return;
                        }
                        const { user: authUser } = await getCurrentUser();
                        if (authUser) {
                          setLoggedIn(true);
                          setCustomerInfo(ci => ({
                            name: authUser.user_metadata?.name || ci.name,
                            email: authUser.email || ci.email,
                            phone: authUser.user_metadata?.phone || ci.phone,
                          }));
                          setAuthPrefilled(true);
                          try { await ensureCustomerRecord(); } catch {}
                        }
                        setShowInlineLogin(false);
                        if (customerInfo.name && customerInfo.phone) {
                          await handleBooking();
                        }
                      }}
                      className="bg-blue-600 text-white rounded-lg px-4"
                    >
                      Sign In
                    </button>
                    {loginError && (
                      <div className="sm:col-span-3 text-sm text-red-600">{loginError}</div>
                    )}
                  </div>
                )}
              </div>
            )}

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

export default function BookingFlow() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading booking flow...</p>
        </div>
      </div>
    }>
      <BookingFlowInner />
    </Suspense>
  );
}