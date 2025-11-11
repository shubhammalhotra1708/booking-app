import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { createServiceClient } from '../../../utils/supabase/service';
import { validateRequest, AvailabilitySchema, createErrorResponse, createSuccessResponse } from '../../../lib/validation';

// GET /api/availability - Check available time slots
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      shop_id: parseInt(searchParams.get('shop_id')),
      service_id: parseInt(searchParams.get('service_id')),
      staff_id: searchParams.get('staff_id') ? parseInt(searchParams.get('staff_id')) : undefined,
      date: searchParams.get('date')
    };

    // Validate query parameters
    const validation = validateRequest(AvailabilitySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid parameters', 400, validation.details),
        { status: 400 }
      );
    }

    const { shop_id, service_id, staff_id, date } = validation.data;
    const supabase = createServiceClient(); // Use service client for full access

    // Get service details (we need duration)
    const { data: service, error: serviceError } = await supabase
      .from('Service')
      .select('id, name, duration, shop_id')
      .eq('id', service_id)
      .eq('shop_id', shop_id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        createErrorResponse('Service not found', 404),
        { status: 404 }
      );
    }

    // Get shop operating hours
    const { data: shop, error: shopError } = await supabase
      .from('Shop')
      .select('id, name, operating_hours')
      .eq('id', shop_id)
      .eq('is_active', true)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        createErrorResponse('Shop not found', 404),
        { status: 404 }
      );
    }

    // Get day of week for operating hours
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = shop.operating_hours[dayOfWeek];

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return NextResponse.json(
        createSuccessResponse([], 'Shop is closed on this day')
      );
    }

    // Get staff who can perform this service (simplified for MVP)
    let availableStaff = [];
    
    if (staff_id) {
      // Check specific staff member (simplified - assume all staff can do all services)
      const { data: specificStaff, error: staffError } = await supabase
        .from('Staff')
        .select('id, name, schedule')
        .eq('id', staff_id)
        .eq('shop_id', shop_id)
        .single();

      if (staffError || !specificStaff) {
        return NextResponse.json(
          createErrorResponse('Staff member not found', 404),
          { status: 404 }
        );
      }

      availableStaff = [specificStaff];
      console.log('Found specific staff:', specificStaff);
    } else {
      // Get all staff (simplified for MVP - assume all staff can do all services)
      const { data: allStaff, error: allStaffError } = await supabase
        .from('Staff')
        .select('id, name, schedule')
        .eq('shop_id', shop_id);

      if (allStaffError) {
        return NextResponse.json(
          createErrorResponse('Failed to fetch staff', 500),
          { status: 500 }
        );
      }

      availableStaff = allStaff || [];
    }

    if (availableStaff.length === 0) {
      return NextResponse.json(
        createSuccessResponse([], 'No staff available for this service')
      );
    }

    // Get existing bookings for this date with more details for UI display
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('Booking')
      .select(`
        staff_id, 
        booking_time, 
        customer_name,
        Service(id, name, duration)
      `)
      .eq('booking_date', date)
      .eq('shop_id', shop_id)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }
    
    console.log('Existing bookings for', date, ':', existingBookings);

    // Generate ALL time slots (available and blocked)
    const allSlots = generateAvailableSlots(
      dayHours.open,
      dayHours.close,
      service.duration,
      availableStaff,
      existingBookings || []
    );

    // If a specific staff was selected, filter and modify slots for that staff
    let filteredSlots = allSlots;
    if (staff_id) {
      const selectedStaff = availableStaff.find(s => s.id === staff_id);
      filteredSlots = allSlots.map(slot => {
        const staffIsAvailable = slot.availableStaff.some(staff => staff.id === staff_id);
        const staffIsBlocked = slot.blockedStaff.some(staff => staff.id === staff_id);
        
        return {
          ...slot,
          isAvailable: staffIsAvailable,
          status: staffIsAvailable ? 'available' : 'blocked',
          selectedStaffStatus: staffIsAvailable ? 'available' : 'blocked',
          availableStaff: staffIsAvailable ? [selectedStaff] : [],
          blockedStaff: staffIsBlocked ? slot.blockedStaff.filter(staff => staff.id === staff_id) : []
        };
      });
    }

    // Separate available and blocked slots for easy frontend handling
    const availableSlots = filteredSlots.filter(slot => slot.isAvailable);
    const blockedSlots = filteredSlots.filter(slot => !slot.isAvailable);

    // Determine appropriate message
    let message = 'Schedule retrieved successfully';
    if (availableSlots.length === 0) {
      if (staff_id) {
        const staffName = availableStaff.find(s => s.id === staff_id)?.name || 'Selected staff';
        message = `${staffName} is fully booked on ${date}. All time slots are shown for reference.`;
      } else {
        message = `Fully booked on ${date}. All time slots are shown for reference.`;
      }
    }

    return NextResponse.json(
      createSuccessResponse({
        date,
        service: {
          id: service.id,
          name: service.name,
          duration: service.duration
        },
        shop: {
          id: shop.id,
          name: shop.name,
          operatingHours: dayHours
        },
        staff: staff_id ? availableStaff.find(s => s.id === staff_id) : null,
        allSlots: filteredSlots,
        availableSlots: availableSlots,
        blockedSlots: blockedSlots,
        summary: {
          totalSlots: filteredSlots.length,
          availableCount: availableSlots.length,
          blockedCount: blockedSlots.length,
          conflictingBookings: existingBookings?.length || 0
        }
      }, message),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
        }
      }
    );

  } catch (error) {
    console.error('Availability API Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, error.message),
      { status: 500 }
    );
  }
}

// Helper function to generate ALL time slots with availability status
function generateAvailableSlots(openTime, closeTime, serviceDuration, staff, existingBookings) {
  const slots = [];
  const slotInterval = 30; // 30-minute intervals
  
  // Convert times to minutes for easier calculation
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  
  // For real-time filtering, use currentMinutes + 15 (not +30) for booking preparation buffer
  
  // Generate ALL time slots (both available and blocked)
  for (let time = openMinutes; time <= closeMinutes - serviceDuration; time += slotInterval) {
    const timeStr = minutesToTime(time);
    const endTimeStr = minutesToTime(time + serviceDuration);
    
    // Check for shop-wide conflicts (bookings with staff_id = null)
    const shopWideConflicts = existingBookings.filter(booking => 
      booking.staff_id === null &&
      timeOverlaps(
        timeStr, 
        endTimeStr,
        booking.booking_time,
        addMinutes(booking.booking_time, booking.Service.duration)
      )
    );
    
    // Check availability for each staff member
    const availableStaffForSlot = [];
    const blockedStaffForSlot = [];
    
    staff.forEach(staffMember => {
      // Check for staff-specific booking conflicts
      const conflicts = existingBookings.filter(booking => 
        booking.staff_id === staffMember.id &&
        timeOverlaps(
          timeStr, 
          endTimeStr,
          booking.booking_time,
          addMinutes(booking.booking_time, booking.Service.duration)
        )
      );
      
      if (conflicts.length === 0 && shopWideConflicts.length === 0) {
        // Staff is available
        availableStaffForSlot.push({
          id: staffMember.id,
          name: staffMember.name
        });
      } else {
        // Staff is blocked
        const blockingBooking = conflicts[0] || shopWideConflicts[0];
        blockedStaffForSlot.push({
          id: staffMember.id,
          name: staffMember.name,
          reason: shopWideConflicts.length > 0 ? 'shop-wide booking' : 'staff booked',
          bookingDetails: blockingBooking ? {
            customer: blockingBooking.customer_name || 'Anonymous',
            service: blockingBooking.Service?.name || 'Unknown Service'
          } : null
        });
      }
    });
    
    // Create slot object with full information
    const slot = {
      time: timeStr,
      endTime: endTimeStr,
      duration: serviceDuration,
      isAvailable: availableStaffForSlot.length > 0,
      availableStaff: availableStaffForSlot,
      blockedStaff: blockedStaffForSlot,
      availableCount: availableStaffForSlot.length,
      blockedCount: blockedStaffForSlot.length,
      status: availableStaffForSlot.length > 0 ? 'available' : 'blocked'
    };
    
    // Add conflict details for blocked slots
    if (shopWideConflicts.length > 0) {
      slot.blockReason = 'shop-wide booking';
      slot.conflictDetails = shopWideConflicts.map(booking => ({
        customer: booking.customer_name || 'Anonymous',
        service: booking.Service?.name || 'Unknown Service',
        time: booking.booking_time
      }));
    }
    
    slots.push(slot);
  }
  
  return slots;
}

// Helper functions
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function timeOverlaps(start1, end1, start2, end2) {
  // Convert all times to minutes for proper comparison
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2.substring(0, 5)); // Handle "HH:MM:SS" format from database
  const e2 = timeToMinutes(end2.substring(0, 5));
  
  return (s1 < e2) && (e1 > s2);
}