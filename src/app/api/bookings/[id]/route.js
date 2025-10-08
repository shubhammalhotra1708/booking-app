import { NextResponse } from 'next/server';
import { createServiceClient } from '../../../../utils/supabase/service';
import { validateRequest, BookingUpdateSchema, createErrorResponse, createSuccessResponse } from '../../../../lib/validation';

// GET /api/bookings/[id] - Get a specific booking
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        createErrorResponse('Invalid booking ID', 400),
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: booking, error } = await supabase
      .from('Booking')
      .select(`
        *,
        Service (id, name, price, duration, category),
        Staff (id, name, role, email, phone),
        Shop (id, name, address, phone, email)
      `)
      .eq('id', parseInt(id))
      .single();

    if (error || !booking) {
      return NextResponse.json(
        createErrorResponse('Booking not found', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(booking, 'Booking retrieved successfully'),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60'
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

// PUT /api/bookings/[id] - Update a booking (limited fields for customer use)
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        createErrorResponse('Invalid booking ID', 400),
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request data (only certain fields can be updated)
    const validation = validateRequest(BookingUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Validation failed', 400, validation.details),
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const updateData = validation.data;

    // First, get the existing booking to check permissions and constraints
    const { data: existingBooking, error: fetchError } = await supabase
      .from('Booking')
      .select(`
        *,
        Service (id, duration),
        Staff (id, name),
        Shop (id, name)
      `)
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        createErrorResponse('Booking not found', 404),
        { status: 404 }
      );
    }

    // Don't allow updates to completed or cancelled bookings
    if (existingBooking.status === 'completed' || existingBooking.status === 'cancelled') {
      return NextResponse.json(
        createErrorResponse('Cannot update completed or cancelled bookings', 400),
        { status: 400 }
      );
    }

    // If updating booking time/date, check for conflicts
    if ((updateData.booking_date || updateData.booking_time) && existingBooking.staff_id) {
      const newDate = updateData.booking_date || existingBooking.booking_date;
      const newTime = updateData.booking_time || existingBooking.booking_time;

      const { data: conflictingBookings } = await supabase
        .from('Booking')
        .select('id, booking_time, Service(duration)')
        .eq('staff_id', existingBooking.staff_id)
        .eq('booking_date', newDate)
        .neq('id', parseInt(id)) // Exclude current booking
        .in('status', ['pending', 'confirmed']);

      if (conflictingBookings && conflictingBookings.length > 0) {
        const requestedStartTime = newTime;
        const requestedEndTime = addMinutes(requestedStartTime, existingBooking.Service.duration);

        for (const existing of conflictingBookings) {
          const existingStartTime = existing.booking_time;
          const existingEndTime = addMinutes(existingStartTime, existing.Service.duration);

          if (timeOverlaps(requestedStartTime, requestedEndTime, existingStartTime, existingEndTime)) {
            return NextResponse.json(
              createErrorResponse('Time slot is already booked', 409),
              { status: 409 }
            );
          }
        }
      }
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('Booking')
      .update(updateData)
      .eq('id', parseInt(id))
      .select(`
        *,
        Service (id, name, price, duration, category),
        Staff (id, name, role, email, phone),
        Shop (id, name, address, phone, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        createErrorResponse('Failed to update booking', 500),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(updatedBooking, 'Booking updated successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Cancel a booking
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        createErrorResponse('Invalid booking ID', 400),
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First check if booking exists and can be cancelled
    const { data: existingBooking, error: fetchError } = await supabase
      .from('Booking')
      .select('id, status, booking_date, booking_time')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        createErrorResponse('Booking not found', 404),
        { status: 404 }
      );
    }

    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        createErrorResponse('Booking is already cancelled', 400),
        { status: 400 }
      );
    }

    if (existingBooking.status === 'completed') {
      return NextResponse.json(
        createErrorResponse('Cannot cancel completed booking', 400),
        { status: 400 }
      );
    }

    // Update status to cancelled instead of deleting
    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('Booking')
      .update({ 
        status: 'cancelled',
        notes: existingBooking.notes ? `${existingBooking.notes}\n[Cancelled by customer]` : '[Cancelled by customer]'
      })
      .eq('id', parseInt(id))
      .select(`
        *,
        Service (id, name, price, duration),
        Staff (id, name, role),
        Shop (id, name)
      `)
      .single();

    if (cancelError) {
      console.error('Error cancelling booking:', cancelError);
      return NextResponse.json(
        createErrorResponse('Failed to cancel booking', 500),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(cancelledBooking, 'Booking cancelled successfully'),
      { status: 200 }
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