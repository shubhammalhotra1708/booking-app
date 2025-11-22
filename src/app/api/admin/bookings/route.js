import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { validateRequest, BookingUpdateSchema, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// GET /api/admin/bookings - Get all bookings for admin dashboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    if (!shopId) {
      return NextResponse.json(
        createErrorResponse('Shop ID is required', 400),
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Build query with your existing table structure
    let query = supabase
      .from('Booking')
      .select(`
        *,
        Service (id, name, price, duration, category),
        Staff (id, name, role, phone),
        Shop (id, name, address, phone, email)
      `)
      .eq('shop_id', parseInt(shopId))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (date) {
      query = query.eq('booking_date', date);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      logger.error('Error fetching bookings:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch bookings', 500),
        { status: 500 }
      );
    }

    // Get counts for dashboard stats
    const { data: stats } = await supabase
      .from('Booking')
      .select('status')
      .eq('shop_id', parseInt(shopId));

    const statusCounts = stats?.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json(
      createSuccessResponse({
        bookings,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        },
        stats: statusCounts
      }, 'Bookings retrieved successfully'),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

// PUT /api/admin/bookings - Update booking status (approve/reject)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { booking_id, status, notes, admin_id } = body;
    
    if (!booking_id || !status) {
      return NextResponse.json(
        createErrorResponse('Booking ID and status are required', 400),
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        createErrorResponse('Invalid status', 400),
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get current booking
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

    // Update booking with your schema
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add admin notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('Booking')
      .update(updateData)
      .eq('id', booking_id)
      .select(`
        *,
        Service (id, name, price, duration),
        Staff (id, name, role),
        Shop (id, name, phone, email)
      `)
      .single();

    if (updateError) {
      logger.error('Error updating booking:', updateError);
      return NextResponse.json(
        createErrorResponse('Failed to update booking', 500),
        { status: 500 }
      );
    }

    // Here you could trigger webhooks/notifications
    // await triggerBookingStatusChangeWebhook(updatedBooking, currentBooking.status, status);

    return NextResponse.json(
      createSuccessResponse(updatedBooking, `Booking ${status} successfully`),
      { status: 200 }
    );

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}