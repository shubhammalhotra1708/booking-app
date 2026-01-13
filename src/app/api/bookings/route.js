import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateRequest, BookingSchema, createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/validation';
import { getCorsHeaders } from '@/lib/cors';
import { normalizePhone, findExistingCustomer } from '@/lib/identity';
import { logger } from '@/lib/logger';

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}

// POST /api/bookings - Create a new booking (public endpoint for customer bookings)
export async function POST(request) {
  try {
    const body = await request.json();
    const validation = validateRequest(BookingSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Validation failed', 400, validation.details, ERROR_CODES.VALIDATION_FAILED),
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const bookingData = validation.data;

    // Shop check
    const { data: shop, error: shopError } = await supabase
      .from('Shop')
      .select('id, name, is_active')
      .eq('id', bookingData.shop_id)
      .eq('is_active', true)
      .single();
    if (shopError || !shop) {
      return NextResponse.json(
        createErrorResponse('Shop not found or inactive', 404, null, ERROR_CODES.INVALID_SHOP),
        { status: 404 }
      );
    }

    // Service check
    const { data: service, error: serviceError } = await supabase
      .from('Service')
      .select('id, name, price, duration, shop_id, is_active')
      .eq('id', bookingData.service_id)
      .eq('shop_id', bookingData.shop_id)
      .eq('is_active', true)
      .single();
    if (serviceError || !service) {
      return NextResponse.json(
        createErrorResponse('Service not found or inactive', 404, null, ERROR_CODES.INVALID_SERVICE),
        { status: 404 }
      );
    }

    // Staff validation with graceful StaffService fallback
    if (bookingData.staff_id) {
      logger.debug('Validating staff:', {
        staff_id: bookingData.staff_id,
        service_id: bookingData.service_id
      });
      
      // First verify staff exists and is active
      const { data: staff, error: staffError } = await supabase
        .from('Staff')
        .select('id, name, is_active, shop_id')
        .eq('id', bookingData.staff_id)
        .eq('shop_id', bookingData.shop_id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (staffError || !staff) {
        logger.error('Staff not found or inactive:', bookingData.staff_id);
        return NextResponse.json(
          createErrorResponse('Selected staff not found or inactive', 400, null, ERROR_CODES.INVALID_STAFF),
          { status: 400 }
        );
      }
      
      // OPTIONAL: Check StaffService mappings if they exist
      // Count how many services this staff has mapped
      const { count: staffServiceCount, error: countError } = await supabase
        .from('StaffService')
        .select('*', { count: 'exact', head: true })
        .eq('staffid', bookingData.staff_id);
      
      // Handle null/undefined count (treat as 0)
      const mappingCount = staffServiceCount ?? 0;
      
      if (countError) {
        logger.warn('⚠️ Error checking StaffService mappings (will allow booking):', countError);
      }
      
      if (mappingCount > 0) {
        // Staff HAS service mappings - enforce them
        const { data: staffService, error: staffServiceError } = await supabase
          .from('StaffService')
          .select('staffid, serviceid')
          .eq('staffid', bookingData.staff_id)
          .eq('serviceid', bookingData.service_id)
          .maybeSingle();
        
        if (staffServiceError) {
          logger.warn('⚠️ Error checking specific staff-service mapping (will allow booking):', staffServiceError);
        } else if (!staffService) {
          logger.warn('⚠️ Staff has service mappings but this service not included:', {
            staff_id: bookingData.staff_id,
            service_id: bookingData.service_id,
            mapped_services: mappingCount
          });
          return NextResponse.json(
            createErrorResponse('Selected staff does not provide this service', 400, null, ERROR_CODES.INVALID_STAFF),
            { status: 400 }
          );
        } else {
          logger.debug('✅ Staff-service validation passed (StaffService enforced)');
        }
      } else {
        // No service mappings for this staff - allow booking (backwards compatible)
        logger.debug('✅ Staff validation passed (StaffService check skipped - no mappings exist)');
      }
    }

    // Identity resolution
    let resolvedCustomerId = null;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const normalizedPhone = normalizePhone(bookingData.customer_phone);
    const customerEmail = bookingData.customer_email || null;
    if (authUser) {
      const { data: existingCustomer } = await supabase
        .from('Customer')
        .select('id, user_id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (existingCustomer) {
        resolvedCustomerId = existingCustomer.id;
      } else if (customerEmail) {
        const { data: emailCustomer } = await supabase
          .from('Customer')
          .select('id, user_id')
          .eq('email', customerEmail)
          .maybeSingle();
        if (emailCustomer) resolvedCustomerId = emailCustomer.id;
      }
      // Auto-create Customer row if none resolved
      if (!resolvedCustomerId) {
        const { data: newCustomer, error: createCustError } = await supabase
          .from('Customer')
          .insert({
            user_id: authUser.id,
            name: bookingData.customer_name,
            phone: normalizedPhone.replace('+','').length > 0 ? normalizedPhone.replace('+','').substring(normalizedPhone.startsWith('+91') ? 3 : 1) : null, // store legacy phone if needed
            phone_normalized: normalizedPhone,
            email: customerEmail || authUser.email || null,
          })
          .select('id')
          .maybeSingle();
        if (createCustError) {
          logger.error('Auto customer creation failed:', createCustError);
          return NextResponse.json(
            createErrorResponse('Failed to create customer profile', 500, null, ERROR_CODES.AUTO_CUSTOMER_CREATE_FAILED),
            { status: 500 }
          );
        }
        if (newCustomer) {
          resolvedCustomerId = newCustomer.id;
        }
      }
    } else {
      const existing = await findExistingCustomer(supabase, { email: customerEmail, phone: normalizedPhone });
      if (existing && existing.user_id) {
        return NextResponse.json(
          createErrorResponse('Account exists. Please sign in to book.', 409, null, ERROR_CODES.ACCOUNT_EXISTS),
          { status: 409 }
        );
      } else if (existing && !existing.user_id) {
        resolvedCustomerId = existing.id;
      } else {
        // Create guest customer row via SECURITY DEFINER RPC to avoid duplicates
        const { data: guestCustomer, error: guestError } = await supabase.rpc('create_guest_customer', {
          p_name: bookingData.customer_name,
          p_phone: normalizedPhone,
          p_email: customerEmail,
        });
        if (guestError) {
          const msg = guestError.message || '';
          if (msg.includes('ACCOUNT_EXISTS')) {
            return NextResponse.json(
              createErrorResponse('Account exists. Please sign in to book.', 409, null, ERROR_CODES.ACCOUNT_EXISTS),
              { status: 409 }
            );
          }
          logger.error('Guest customer create failed:', guestError);
          return NextResponse.json(
            createErrorResponse('Failed to create guest customer', 500, null, ERROR_CODES.GUEST_CUSTOMER_CREATE_FAILED),
            { status: 500 }
          );
        }
        if (guestCustomer && guestCustomer.length > 0) {
          resolvedCustomerId = guestCustomer[0].id;
        }
      }
    }

    const rpcParams = {
      p_shop_id: bookingData.shop_id,
      p_service_id: bookingData.service_id,
      p_customer_name: bookingData.customer_name,
      p_customer_phone: normalizedPhone,
      p_date: bookingData.booking_date,
      p_time: bookingData.booking_time.includes(':') && bookingData.booking_time.split(':').length === 2 
        ? `${bookingData.booking_time}:00` 
        : bookingData.booking_time,
      p_duration_min: service.duration,
      p_staff_id: bookingData.staff_id || null,
      p_customer_id: resolvedCustomerId,
      p_customer_email: customerEmail,
      p_customer_notes: bookingData.customer_notes || bookingData.notes || null,
    };

    logger.info('RPC params with types:', Object.entries(rpcParams).map(([k, v]) => `${k}: ${v} (${typeof v})`).join(', '));

    const { data: booking, error: rpcError } = await supabase.rpc('book_slot', rpcParams);

    if (rpcError) {
      logger.error('RPC book_slot error:', rpcError);
      const msg = rpcError.message || '';
      if (msg.includes('SLOT_CONFLICT')) {
        return NextResponse.json(
          createErrorResponse('Time slot is already booked', 409, null, ERROR_CODES.SLOT_CONFLICT),
          { status: 409 }
        );
      }
      if (msg.includes('INVALID_SHOP')) {
        return NextResponse.json(createErrorResponse('Shop not found or inactive', 404, null, ERROR_CODES.INVALID_SHOP), { status: 404 });
      }
      if (msg.includes('INVALID_SERVICE')) {
        return NextResponse.json(createErrorResponse('Service not found or inactive', 404, null, ERROR_CODES.INVALID_SERVICE), { status: 404 });
      }
      if (msg.includes('INVALID_STAFF')) {
        return NextResponse.json(createErrorResponse('Staff member not found or not available', 404, null, ERROR_CODES.INVALID_STAFF), { status: 404 });
      }
      if (msg.includes('INVALID_DURATION')) {
        return NextResponse.json(createErrorResponse('Invalid duration', 400, null, ERROR_CODES.INVALID_DURATION), { status: 400 });
      }
      return NextResponse.json(createErrorResponse('Failed to create booking', 500, null, ERROR_CODES.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse({ ...booking, customer_id: resolvedCustomerId }, 'Booking created successfully'),
      { status: 201, headers: getCorsHeaders(request.headers.get('origin')) }
    );
  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, null, ERROR_CODES.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

// GET /api/bookings - Retrieve bookings by shop, booking_id, customer_id, phone or email
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const bookingId = searchParams.get('booking_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const customerPhone = searchParams.get('customer_phone');
    const customerEmail = searchParams.get('customer_email');
    const customerId = searchParams.get('customer_id');

    if (!shopId && !bookingId && !customerId && !customerPhone && !customerEmail) {
      return NextResponse.json(
        createErrorResponse('Shop ID, Booking ID, Customer ID, or customer info is required', 400, null, ERROR_CODES.VALIDATION_FAILED),
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let query = supabase
      .from('Booking')
      .select(`
        *,
        Service!Booking_service_id_fkey (id, name, price, duration),
        Staff!Booking_staff_id_fkey (id, name, role),
        Shop!Booking_shop_id_fkey (id, name)
      `);

    if (bookingId) {
      query = query.eq('id', parseInt(bookingId, 10));
      const phone = searchParams.get('phone');
      const email = searchParams.get('email');
      if (phone) query = query.eq('customer_phone', phone);
      else if (email) query = query.eq('customer_email', email);
    } else if (customerId) {
      query = query.eq('customer_id', customerId).order('booking_date', { ascending: false });
    } else if (customerPhone || customerEmail) {
      if (customerPhone) query = query.eq('customer_phone', customerPhone);
      else if (customerEmail) query = query.eq('customer_email', customerEmail);
      query = query.order('booking_date', { ascending: false });
    } else {
      query = query
        .eq('shop_id', parseInt(shopId, 10))
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });
      if (status) query = query.eq('status', status);
      if (date) query = query.eq('booking_date', date);
    }

    const { data: bookings, error } = await query;
    if (error) {
      logger.error('Error fetching bookings:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch bookings', 500, null, ERROR_CODES.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    if (bookingId) {
      if (!bookings || bookings.length === 0) {
        return NextResponse.json(
          createErrorResponse('Booking not found or credentials do not match', 404, null, ERROR_CODES.INVALID_SERVICE),
          { status: 404 }
        );
      }
      return NextResponse.json(
        createSuccessResponse(bookings[0], 'Booking retrieved successfully'),
        {
          status: 200,
          headers: {
            ...getCorsHeaders(request.headers.get('origin')),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }

    return NextResponse.json(
      createSuccessResponse(bookings, 'Bookings retrieved successfully'),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(request.headers.get('origin')),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, null, ERROR_CODES.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

// PUT /api/bookings - Update booking (for status changes, etc.)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { booking_id, ...updateData } = body;
    
    if (!booking_id) {
      return NextResponse.json(
        createErrorResponse('Booking ID is required', 400),
        { status: 400 }
      );
    }

  const supabase = await createClient();

    // Get current booking for webhook
    const { data: currentBooking, error: fetchError } = await supabase
      .from('Booking')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchError || !currentBooking) {
      return NextResponse.json(
        createErrorResponse('Booking not found', 404),
        { status: 404 }
      );
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('Booking')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .select(`
        *,
        Service!Booking_service_id_fkey (id, name, price, duration),
        Staff!Booking_staff_id_fkey (id, name, role),
        Shop!Booking_shop_id_fkey (id, name)
      `)
      .single();

    if (updateError) {
      logger.error('Error updating booking:', updateError);
      return NextResponse.json(
        createErrorResponse('Failed to update booking', 500),
        { status: 500 }
      );
    }

    // ✅ REMOVED WEBHOOK: Realtime subscriptions will handle notifications automatically
    // Admin dashboard subscribes to Booking table changes via Supabase Realtime
    // No need for localhost:3000 → localhost:3001 HTTP calls anymore

    return NextResponse.json(
      createSuccessResponse(updatedBooking, 'Booking updated successfully'),
      { headers: getCorsHeaders(request.headers.get('origin')) }
    );

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

// Helper functions
function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function timeOverlaps(start1, end1, start2, end2) {
  return (start1 < end2) && (end1 > start2);
}