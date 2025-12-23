'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, User, Calendar, Check, MapPin } from 'lucide-react';
import ErrorCodeAlert from '@/components/ErrorCodeAlert';
import TempAccountBanner from '@/components/TempAccountBanner';
import { getCurrentUser, ensureCustomerRecord, signInAnonymously } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { getTodayIST } from '@/utils/timezone';

function BookingFlowInner() {
  const componentId = `COMPONENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🏗️ [${componentId}] BookingFlowInner RENDER START`);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const shopId = searchParams.get('shop_id');
  const serviceId = searchParams.get('service_id');
  const step = parseInt(searchParams.get('step') || '1');

  console.log(`🏗️ [${componentId}] URL params - shopId: ${shopId}, serviceId: ${serviceId}, step: ${step}`);

  // State
  const [loading, setLoading] = useState(false);
  const [shop, setShop] = useState(null);
  const [service, setService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // 🕐 Default to today's date in IST to avoid "date in past" errors
    const todayIST = getTodayIST();
    logger.debug('🗓️ Initializing selectedDate to IST today:', todayIST);
    return todayIST;
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
  const [authUserMeta, setAuthUserMeta] = useState(null); // store auth user metadata for tempAccount flag
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingErrorCode, setBookingErrorCode] = useState(null); // backend error_code for structured messaging
  const [autoAdvancedToday, setAutoAdvancedToday] = useState(false);

  // Refs to prevent duplicate API calls during React Strict Mode
  const fetchingShopService = useRef(false);
  const fetchingAvailability = useRef(false);

  // Load shop and service data
  useEffect(() => {
    const fetchData = async () => {
      if (!shopId || !serviceId) return;
      
      // Prevent duplicate calls in Strict Mode
      if (fetchingShopService.current) {
        console.log('⏭️ Skipping duplicate shop/service fetch (already in progress)');
        return;
      }
      
      const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔄 [${callId}] useEffect SHOP/SERVICE triggered - shopId: ${shopId}, serviceId: ${serviceId}`);
      
      fetchingShopService.current = true;
      try {
        console.log(`🌐 [${callId}] Fetching shop and service data...`);
        
        const [shopRes, serviceRes] = await Promise.all([
          fetch(`/api/shops?shop_id=${shopId}`),
          fetch(`/api/services?shop_id=${shopId}&service_id=${serviceId}`)
        ]);

        const shopData = await shopRes.json();
        const serviceData = await serviceRes.json();

        console.log(`📦 [${callId}] Raw API response - serviceData:`, JSON.stringify(serviceData, null, 2));

        if (shopData.success && shopData.data.length > 0) {
          console.log(`✅ [${callId}] Shop loaded:`, shopData.data[0].name);
          setShop(shopData.data[0]);
        }

        if (serviceData.success && serviceData.data.length > 0) {
          // 🔍 API returns ALL services for shop, need to find the specific one
          const targetService = serviceData.data.find(s => s.id === parseInt(serviceId));
          
          if (targetService) {
            console.log(`✅ [${callId}] Service loaded - ID: ${targetService.id}, Name: ${targetService.name}`);
            setService(targetService);
          } else {
            console.error(`❌ [${callId}] Service ID ${serviceId} not found in response. Using first service as fallback.`);
            setService(serviceData.data[0]);
          }
        } else {
          console.error(`❌ [${callId}] Service not found in response:`, serviceData);
        }
      } catch (error) {
        console.error(`❌ [${callId}] Error fetching data:`, error);
      } finally {
        fetchingShopService.current = false;
      }
    };

    fetchData();
  }, [shopId, serviceId]);

  // Auto-fetch slots when date/service changes and we're on step 1
  useEffect(() => {
    // Prevent duplicate calls in Strict Mode
    if (fetchingAvailability.current) {
      console.log('⏭️ Skipping duplicate availability fetch (already in progress)');
      return;
    }
    
    const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📡 [${callId}] useEffect AVAILABILITY triggered - Date: ${selectedDate}, Step: ${step}, Service: ${serviceId}`);
    
    if (selectedDate && step === 1 && shopId && serviceId) {
      console.log(`🌐 [${callId}] Calling fetchAvailableSlots...`);
      fetchingAvailability.current = true;
      fetchAvailableSlots(selectedDate, callId);
    } else {
      console.log(`⏭️ [${callId}] Skipped - conditions not met`);
    }
  }, [selectedDate, step, shopId, serviceId]); // Trigger on any of these changes

  // Re-populate staff list when returning to step 2
  useEffect(() => {
    if (step === 2 && selectedSlot && (!staffForSlot || staffForSlot.length === 0)) {
      console.log('🔄 Repopulating staff list for selected slot:', selectedSlot.time);
      // Find the slot in availableSlots to get fresh availableStaff data
      const freshSlot = availableSlots.find(s => s.time === selectedSlot.time);
      if (freshSlot && freshSlot.availableStaff) {
        setStaffForSlot(freshSlot.availableStaff);
        console.log('✅ Restored staff list:', freshSlot.availableStaff.length, 'staff members');
      } else {
        console.warn('⚠️ Could not find fresh slot data, using slot.availableStaff');
        setStaffForSlot(selectedSlot.availableStaff || []);
      }
    }
  }, [step, selectedSlot, availableSlots]);

  // If user is already logged in, prefill step 3 with known info
  useEffect(() => {
    const prefillFromAuth = async () => {
      if (step !== 3 || authPrefilled) return;
      
      try {
        const { user: authUser } = await getCurrentUser();
        if (!authUser) return;
        
        // Check if it's a real user (not anonymous)
        const isAnonymous = authUser.user_metadata?.anonymous || 
                           authUser.app_metadata?.provider === 'anonymous' ||
                           !authUser.email;
        
        if (isAnonymous) {
          logger.debug('👻 Anonymous user - no prefill');
          setAuthPrefilled(true);
          return;
        }
        
        setLoggedIn(true);
        logger.debug('👤 Logged user detected, pre-filling...');
        
        // Try to get Customer record first for most complete data
        const supabase = (await import('@/utils/supabase/client')).createClient();
        const { data: customer, error: customerError } = await supabase
          .from('Customer')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();
        
        if (customerError) {
          logger.warn('⚠️ Error fetching customer:', customerError.message);
        }
        
        if (customer) {
          logger.debug('✅ Pre-filling from Customer record:', { 
            name: customer.name, 
            email: customer.email,
            phone: customer.phone 
          });
          setCustomerInfo({
            name: customer.name || authUser.user_metadata?.name || '',
            email: customer.email || authUser.email || '',
            phone: customer.phone || authUser.user_metadata?.phone || ''
          });
        } else {
          logger.debug('ℹ️ No Customer record, using auth metadata');
          // Fallback to auth metadata
          const sanitizedEmail = authUser.email?.endsWith('@phone.local') ? '' : authUser.email;
          setCustomerInfo({
            name: authUser.user_metadata?.name || '',
            email: sanitizedEmail || '',
            phone: authUser.user_metadata?.phone || ''
          });
        }
        
        setAuthUserMeta(authUser.user_metadata || {});
        setAuthPrefilled(true);
        
        // Ensure customer exists in background for smoother booking
        try { 
          await ensureCustomerRecord(); 
          logger.debug('✅ Customer record ensured in background');
        } catch (e) {
          logger.warn('⚠️ Could not ensure customer record:', e.message);
        }
      } catch (error) {
        console.error('❌ Error in prefillFromAuth:', error);
        setAuthPrefilled(true); // Mark as done to prevent infinite loop
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
  const fetchAvailableSlots = async (date, callId = 'manual') => {
    if (!date || !shopId || !serviceId) {
      console.log(`⏭️ [${callId}] fetchAvailableSlots skipped - missing params`);
      fetchingAvailability.current = false; // Reset flag
      return;
    }
    
    setLoading(true);
    try {
      console.log(`🌐 [${callId}] Fetching: /api/availability?shop_id=${shopId}&service_id=${serviceId}&date=${date}`);
      const response = await fetch(
        `/api/availability?shop_id=${shopId}&service_id=${serviceId}&date=${date}`
      );
      const data = await response.json();
      console.log(`📦 [${callId}] API Response:`, data);
      
      if (data.success && data.data?.availableSlots) {
        console.log(`✅ [${callId}] Setting ${data.data.availableSlots.length} slots`);
        setAvailableSlots(data.data.availableSlots);
      } else {
        console.log(`⚠️ [${callId}] No slots available - ${data.message}`);
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error(`❌ [${callId}] Error fetching slots:`, err);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
      fetchingAvailability.current = false; // ✅ CRITICAL: Reset flag to allow future fetches
      console.log(`🏁 [${callId}] fetchAvailableSlots COMPLETE`);
    }
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📅 [${callId}] handleDateSelect CALLED - date: ${date}`);
    
    setSelectedDate(date);
    // Reset auto-advance whenever user changes date explicitly
    setAutoAdvancedToday(false);
    setSelectedSlot(null);
    setSelectedStaff(null);
    setAvailableSlots([]);
    setStaffForSlot([]);
    
    console.log(`📅 [${callId}] handleDateSelect COMPLETE - date set to: ${date}, useEffect will trigger`);
    // Don't call fetchAvailableSlots here - let the useEffect handle it to avoid double calls
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
    
    // Email is now required
    if (!customerInfo.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Booking execution (final confirmation step)
  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setBookingError('');
    setBookingErrorCode(null);
    
    try {
      // Step 1: Ensure we have an authenticated session (either existing or anonymous)
      let { user: authUser } = await getCurrentUser();
      
      if (!authUser) {
        // No session at all - create anonymous user
        logger.debug('👤 No session found, creating anonymous user...');
        const anonResult = await signInAnonymously();
        
        if (!anonResult.success) {
          setBookingErrorCode('ANON_DISABLED');
          setBookingError('Could not create guest session. Please enable anonymous auth in Supabase or sign in.');
          setLoading(false);
          return;
        }
        
        authUser = anonResult.data?.user;
        logger.debug('✅ Anonymous user created:', authUser?.id);
      }
      
      // Check if user is anonymous
      const isAnonymous = authUser?.user_metadata?.anonymous || 
                         authUser?.app_metadata?.provider === 'anonymous' ||
                         !authUser?.email;
      
      logger.debug('User status:', { 
        id: authUser?.id, 
        isAnonymous, 
        email: authUser?.email 
      });

      // Step 2: Check for existing claimed account with same phone/email
      const { findExistingCustomer } = await import('@/lib/identity');
      const { normalizePhone } = await import('@/lib/identity');
      const supabase = (await import('@/utils/supabase/client')).createClient();
      
      const phoneNormalized = normalizePhone(customerInfo.phone);
      const existingCustomer = await findExistingCustomer(supabase, {
        email: customerInfo.email || null,
        phone: phoneNormalized
      });
      
      if (existingCustomer && existingCustomer.user_id && existingCustomer.user_id !== authUser.id) {
        // Another user already claimed this phone/email
        setBookingErrorCode('ACCOUNT_EXISTS');
        setBookingError('An account exists with these details. Please sign in to continue.');
        setLoading(false);
        return;
      }

      // Step 3: Create/link Customer record for this user
      // For logged-in (non-anonymous) users, try to reuse existing Customer
      let customerId;
      let customerRes;
      
      if (!isAnonymous) {
        // Logged user - check if they already have a Customer record
        logger.debug('🔍 Checking for existing Customer record for logged user...');
        const { data: existingCustomer } = await supabase
          .from('Customer')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();
        
        if (existingCustomer) {
          logger.debug('✅ Found existing Customer, checking if details changed...');
          
          // Check if user changed their booking details
          const nameChanged = existingCustomer.name !== customerInfo.name;
          const emailChanged = existingCustomer.email !== customerInfo.email;
          const phoneNorm = normalizePhone(customerInfo.phone);
          const phoneChanged = existingCustomer.phone_normalized !== phoneNorm;
          
          if (nameChanged || emailChanged || phoneChanged) {
            logger.debug('📝 User changed details during booking:', {
              name: nameChanged ? `${existingCustomer.name} → ${customerInfo.name}` : 'unchanged',
              email: emailChanged ? `${existingCustomer.email} → ${customerInfo.email}` : 'unchanged',
              phone: phoneChanged ? `${existingCustomer.phone} → ${customerInfo.phone}` : 'unchanged'
            });
            
            // For now: Update their profile with new details
            // TODO: In future, add modal to ask "Update profile or just this booking?"
            const { error: updateErr } = await supabase
              .from('Customer')
              .update({
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone,
                phone_normalized: phoneNorm
              })
              .eq('user_id', authUser.id);
            
            if (updateErr) {
              console.error('⚠️ Could not update Customer profile:', updateErr.message);
              
              // Check if it's a unique constraint violation (email/phone taken by another user)
              if (updateErr.code === '23505') {
                setBookingErrorCode('ACCOUNT_EXISTS');
                setBookingError('The email or phone number you entered is already registered to another account. Please use your own contact details or sign in with that account.');
                setLoading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return; // ❌ BLOCK booking - don't continue with old data
              }
              
              // Other errors - also block to be safe
              setBookingErrorCode('CUSTOMER_UPDATE_FAILED');
              setBookingError('Could not update your profile. Please try again or contact support.');
              setLoading(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            } else {
              logger.debug('✅ Customer profile updated with new details');
            }
          } else {
            logger.debug('✅ Details unchanged, reusing existing Customer');
          }
          
          customerId = existingCustomer.id;
          customerRes = { success: true, data: existingCustomer };
        } else {
          // No existing Customer - create one directly for logged user
          logger.debug('📝 No existing Customer found, creating new record for logged user...');
          const phoneNorm = normalizePhone(customerInfo.phone);
          
          const { data: newCustomer, error: createErr } = await supabase
            .from('Customer')
            .insert({
              user_id: authUser.id,
              name: customerInfo.name,
              email: customerInfo.email || null,
              phone: customerInfo.phone,
              phone_normalized: phoneNorm
            })
            .select('*')
            .maybeSingle();
          
          if (createErr) {
            console.error('❌ Failed to create Customer for logged user:', createErr.message);
            
            // Handle unique constraint violation (race condition)
            if (createErr.code === '23505') {
              if (createErr.message.includes('email')) {
                setBookingErrorCode('ACCOUNT_EXISTS');
                setBookingError('This email was just taken by another user. Please use a different email or try again.');
              } else if (createErr.message.includes('phone')) {
                setBookingErrorCode('ACCOUNT_EXISTS');
                setBookingError('This phone number was just taken by another user. Please use a different number or try again.');
              } else {
                setBookingErrorCode('ACCOUNT_EXISTS');
                setBookingError('Your contact details conflict with another account. Please try different details.');
              }
              setLoading(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            
            // Other errors
            customerRes = { success: false, error: createErr.message };
          } else {
            logger.debug('✅ Created new Customer for logged user:', newCustomer.id);
            customerId = newCustomer.id;
            customerRes = { success: true, data: newCustomer };
          }
        }
      } else {
        // Anonymous user - use ensureCustomerRecord as before
        logger.debug('👻 Anonymous user, using ensureCustomerRecord...');
        customerRes = await ensureCustomerRecord({
          name: customerInfo.name,
          email: customerInfo.email || null,
          phone: customerInfo.phone,
        });
      }
      
      if (!customerRes?.success || !customerRes?.data) {
        console.error('❌ Customer record creation failed:', customerRes?.error);
        
        // Check if it's an account conflict or email already registered
        if (customerRes?.error === 'EMAIL_REGISTERED') {
          setBookingErrorCode('EMAIL_REGISTERED');
          setBookingError(customerRes?.message || 'This email is already registered. Please sign in to continue.');
        } else if (customerRes?.error === 'EXISTING_ACCOUNT_SIGNIN_REQUIRED') {
          setBookingErrorCode('EXISTING_ACCOUNT_SIGNIN_REQUIRED');
          setBookingError(customerRes?.message || 'This email/phone is already registered. Please sign in to link your bookings.');
          // TODO: Show sign-in modal with option to transfer anonymous bookings
        } else if (customerRes?.error === 'ACCOUNT_EXISTS') {
          setBookingErrorCode('ACCOUNT_EXISTS');
          setBookingError('An account exists with these details. Please sign in to continue.');
        } else if (customerRes?.error?.includes('Phone or email already registered')) {
          setBookingErrorCode('ACCOUNT_EXISTS');
          setBookingError('This phone number or email is already registered. Please sign in or use different contact details.');
        } else if (customerRes?.error?.includes('duplicate key value')) {
          setBookingErrorCode('ACCOUNT_EXISTS');
          setBookingError('An account with this phone or email already exists. Please sign in to link your bookings.');
        } else {
          setBookingErrorCode('CUSTOMER_CREATE_FAILED');
          setBookingError('Could not create your profile. Please try again or contact support.');
        }
        
        setLoading(false);
        
        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      if (!customerId) {
        customerId = customerRes.data.id;
      }
      logger.debug('✅ Customer record ready:', customerId);

      // Step 4: Create booking
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

      logger.debug('📤 Sending booking request:', bookingData);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        logger.debug('✅ Booking created successfully:', data.data);
        // Redirect to my-bookings (now supports anonymous users)
        router.push(`/my-bookings?highlight=${data.data.id}`);
      } else {
        console.error('❌ Booking failed:', data);
        // Structured error_code awareness
        const code = data.error_code;
        setBookingErrorCode(code || null);
        
        switch (code) {
          case 'VALIDATION_FAILED':
            setBookingError('Please check your information and try again.');
            console.error('Validation details:', data.details);
            break;
          case 'SLOT_CONFLICT':
            setBookingError('That time was just taken. Please pick a different slot.');
            break;
          case 'INVALID_STAFF':
            setBookingError('Selected staff no longer provides this service. Please reselect.');
            break;
          case 'ACCOUNT_EXISTS':
            setBookingError('An account exists with these details. Please sign in to link your bookings.');
            break;
          case 'CLAIM_CONFLICT':
            setBookingError('Another account already claimed this phone/email. Please sign in with the original account.');
            break;
          case 'GUEST_CUSTOMER_CREATE_FAILED':
            setBookingError('We could not create your guest profile. Please retry or sign in.');
            break;
          case 'AUTO_CUSTOMER_CREATE_FAILED':
            setBookingError('Account setup incomplete. Please refresh or contact support.');
            break;
          default:
            if (response.status === 404) {
              setBookingError('Service or staff is unavailable for this shop. Please try another option.');
            } else if (response.status === 400) {
              setBookingError(data.error || 'Invalid booking information. Please check all fields.');
            } else {
              setBookingError(data.error || 'Booking failed. Please try again.');
            }
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError('Booking failed: Network error');
      setBookingErrorCode('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  };

  // Step advancement from contact info to confirmation
  const goToConfirmation = () => {
    if (!validateForm()) return;
    goToStep(4);
  };

  const formatDateLong = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const servicePrice = typeof service === 'object' ? service?.price : null;
  const totalPrice = servicePrice || 0; // extend later for add-ons, taxes

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
    <div className="min-h-screen bg-gray-50" key={`service-${serviceId}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-sky-600 hover:text-sky-700 transition-colors">
                BookEz
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <button
                onClick={goBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
            
            {/* Service & Shop Info - Centered */}
            <div className="flex-1 text-center px-4">
              <div className="max-w-md mx-auto">
                <h1 className="text-xl font-bold text-gray-900 mb-0.5 truncate">
                  {service?.name || 'Loading...'}
                </h1>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span className="truncate">{shop?.name || ''}</span>
                </div>
              </div>
            </div>
            
            {/* Spacer for balance */}
            <div className="w-24"></div>
          </div>
          
          {/* Progress indicator */}
          <div className="pb-4">
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex flex-col items-center">
                  <div
                    className={`h-2 w-16 rounded-full transition-colors ${
                      stepNum <= step ? 'bg-sky-500' : 'bg-gray-200'
                    }`}
                  />
                  <span className={`text-xs mt-1 font-medium ${
                    stepNum <= step ? 'text-sky-600' : 'text-gray-400'
                  }`}>
                    {stepNum === 1 ? 'Date' : stepNum === 2 ? 'Staff' : stepNum === 3 ? 'Details' : 'Confirm'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {loggedIn && authUserMeta?.tempAccount && (
            <div className="mt-4">
              <TempAccountBanner onSetPassword={() => router.push('/my-bookings?set_password=1')} />
            </div>
          )}
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
              <ErrorCodeAlert code={bookingErrorCode} message={bookingError} />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
              <p className="text-gray-600">We need your details to confirm the booking</p>
            </div>

            {/* Inline sign in option */}
            {!loggedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Already have an account?</span>
                  </div>
                  <button
                    onClick={() => { setShowInlineLogin(!showInlineLogin); setLoginError(''); }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {showInlineLogin ? 'Hide sign in' : 'Sign in to auto-fill'}
                  </button>
                </div>
                {showInlineLogin && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email or Phone</label>
                      <input
                        type="text"
                        placeholder="your.email@example.com or 9876543210"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        setLoginError('');
                        const identifier = loginForm.email.trim();
                        const isEmail = /\S+@\S+\.\S+/.test(identifier);
                        
                        const { signInWithEmail, signInWithPhone } = await import('@/lib/auth-helpers');
                        const result = isEmail 
                          ? await signInWithEmail({ email: identifier, password: loginForm.password })
                          : await signInWithPhone({ phone: identifier, password: loginForm.password });
                          
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-3 transition-colors"
                    >
                      Sign In
                    </button>
                    {loginError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{loginError}</p>
                      </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
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
              
              {/* Only show guest account message for non-logged users */}
              {!loggedIn && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 We'll create a guest account for you. After booking, you can set a password to access your bookings anytime.
                  </p>
                </div>
              )}
              
              {/* Show update message for logged users */}
              {loggedIn && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✅ Booking as <span className="font-medium">{customerInfo.email || 'registered user'}</span>. You can update your details above if needed.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={goBack}
                type="button"
                className="w-full sm:w-1/3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={goToConfirmation}
                disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.email || loading}
                className="w-full sm:flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Validating...' : 'Review & Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation Panel */}
        {step === 4 && (
          <div className="space-y-6">
            {bookingError && (
              <ErrorCodeAlert code={bookingErrorCode} message={bookingError} />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
              <p className="text-gray-600">Double-check your booking details before finalizing.</p>
            </div>
            <div className="grid gap-4">
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Date & Time</span>
                  <span className="text-sm text-gray-900">{formatDateLong(selectedDate)} @ {selectedSlot?.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Service</span>
                  <span className="text-sm text-gray-900">{service?.name} {servicePrice ? `₹${servicePrice}` : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Staff</span>
                  <span className="text-sm text-gray-900">{selectedStaff?.name || 'Any available staff'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Duration</span>
                  <span className="text-sm text-gray-900">{service?.duration ? `${service.duration} min` : '—'}</span>
                </div>
                <div className="border-t pt-3 mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Total</span>
                  <span className="text-base font-bold text-gray-900">{totalPrice ? `₹${totalPrice}` : 'N/A'}</span>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Name</span>
                  <span className="text-sm text-gray-900">{customerInfo.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Phone</span>
                  <span className="text-sm text-gray-900">{customerInfo.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Email</span>
                  <span className="text-sm text-gray-900">{customerInfo.email || '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => goToStep(3)}
                type="button"
                className="w-full sm:w-1/3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Edit Details
              </button>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="w-full sm:flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? 'Saving...' : (<><Check className="h-5 w-5" /><span>Confirm Booking</span></>)}
              </button>
            </div>
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