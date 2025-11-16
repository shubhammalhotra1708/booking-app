import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateRequest, BookingSchema, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3001',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/bookings - Create a new booking (public endpoint for customer bookings)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validation = validateRequest(BookingSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Validation failed', 400, validation.details),
        { status: 400 }
      );
    }

  const supabase = await createClient();
    const bookingData = validation.data;

    // Check if the shop exists and is active
    const { data: shop, error: shopError } = await supabase
      .from('Shop')
      .select('id, name, is_active')
      .eq('id', bookingData.shop_id)
      .eq('is_active', true)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        createErrorResponse('Shop not found or inactive', 404),
        { status: 404 }
      );
    }

    // Check if the service exists and belongs to the shop
    const { data: service, error: serviceError } = await supabase
      .from('Service')
      .select('id, name, price, duration, shop_id')
      .eq('id', bookingData.service_id)
      .eq('shop_id', bookingData.shop_id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        createErrorResponse('Service not found or inactive', 404),
        { status: 404 }
      );
    }

    // Use atomic RPC to book the slot with revalidation and advisory locking
    const { data: booking, error: rpcError } = await supabase.rpc('book_slot', {
      p_shop_id: bookingData.shop_id,
      p_service_id: bookingData.service_id,
      p_staff_id: bookingData.staff_id || null,
      p_customer_id: bookingData.customer_id || null,
      p_customer_name: bookingData.customer_name,
      p_customer_email: bookingData.customer_email || null,
      p_customer_phone: bookingData.customer_phone,
      p_date: bookingData.booking_date,
      p_time: bookingData.booking_time,
      p_duration_min: service.duration,
      p_customer_notes: bookingData.customer_notes || bookingData.notes || null,
    });

    if (rpcError) {
      console.error('RPC book_slot error:', rpcError);
      const msg = rpcError.message || '';
      if (msg.includes('SLOT_CONFLICT')) {
        return NextResponse.json(
          createErrorResponse('Time slot is already booked', 409),
          { status: 409 }
        );
      }
      if (msg.includes('INVALID_SHOP')) {
        return NextResponse.json(createErrorResponse('Shop not found or inactive', 404), { status: 404 });
      }
      if (msg.includes('INVALID_SERVICE')) {
        return NextResponse.json(createErrorResponse('Service not found or inactive', 404), { status: 404 });
      }
      if (msg.includes('INVALID_STAFF')) {
        return NextResponse.json(createErrorResponse('Staff member not found or not available', 404), { status: 404 });
      }
      if (msg.includes('INVALID_DURATION')) {
        return NextResponse.json(createErrorResponse('Invalid duration', 400), { status: 400 });
      }
      return NextResponse.json(createErrorResponse('Failed to create booking', 500), { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(booking, 'Booking created successfully'),
      { status: 201 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

// GET /api/bookings - Get bookings for a specific shop or by booking ID (public endpoint)
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
    
    // Either shop_id, booking_id, customer_id, or customer info is required
    if (!shopId && !bookingId && !customerId && !customerPhone && !customerEmail) {
      return NextResponse.json(
        createErrorResponse('Shop ID, Booking ID, Customer ID, or customer info is required', 400),
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

    // If booking_id is provided, get specific booking with verification
    if (bookingId) {
      query = query.eq('id', parseInt(bookingId));
      
      // For customer booking lookup, require phone or email verification
      const phone = searchParams.get('phone');
      const email = searchParams.get('email');
      
      if (phone || email) {
        // Add customer verification - they must provide either phone or email that matches
        if (phone) {
          query = query.eq('customer_phone', phone);
        } else if (email) {
          query = query.eq('customer_email', email);
        }
      }
    } else if (customerId) {
      // Customer lookup by customer_id (for logged-in users)
      query = query.eq('customer_id', customerId);
      query = query.order('booking_date', { ascending: false });
    } else if (customerPhone || customerEmail) {
      // Customer lookup for their bookings (legacy/guest bookings)
      if (customerPhone) {
        query = query.eq('customer_phone', customerPhone);
      } else if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      }
      query = query.order('booking_date', { ascending: false });
    } else {
      // Otherwise, get bookings for shop with filters
      query = query
        .eq('shop_id', parseInt(shopId))
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (date) {
        query = query.eq('booking_date', date);
      }
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch bookings', 500),
        { status: 500 }
      );
    }

    // If looking up by booking_id, return single booking or error
    if (bookingId) {
      if (!bookings || bookings.length === 0) {
        return NextResponse.json(
          createErrorResponse('Booking not found or credentials do not match', 404),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createSuccessResponse(bookings[0], 'Booking retrieved successfully'),
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }

    // Otherwise return array of bookings
    return NextResponse.json(
      createSuccessResponse(bookings, 'Bookings retrieved successfully'),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
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
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        createErrorResponse('Failed to update booking', 500),
        { status: 500 }
      );
    }

    // ✅ REMOVED WEBHOOK: Realtime subscriptions will handle notifications automatically
    // Admin dashboard subscribes to Booking table changes via Supabase Realtime
    // No need for localhost:3000 → localhost:3001 HTTP calls anymore

    return NextResponse.json(
      createSuccessResponse(updatedBooking, 'Booking updated successfully')
    );

  } catch (error) {
    console.error('API Error:', error);
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