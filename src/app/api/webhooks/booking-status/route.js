import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';

// POST /api/webhooks/booking-status - Handle booking status updates
export async function POST(request) {
  try {
    const { booking_id, old_status, new_status, shop_id } = await request.json();
    
    const supabase = createServiceClient();
    
    // Get booking details for notification
    const { data: booking, error } = await supabase
      .from('Booking')
      .select(`
        *,
        Service (name),
        Shop (name, phone, email)
      `)
      .eq('id', booking_id)
      .single();
    
    if (error) {
      console.error('Error fetching booking for webhook:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    
    // Send notifications based on status change
    await sendNotifications({ booking, old_status, new_status });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      booking_id,
      status_change: `${old_status} → ${new_status}`
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Simulate sending notifications (replace with real implementation)
async function sendNotifications({ booking, old_status, new_status }) {
  try {
    // In production, integrate with actual email/SMS services
    // For MVP, we'll simulate the notifications
    
    switch (new_status) {
      case 'confirmed':
        // Simulate customer confirmation notifications
        if (process.env.NODE_ENV === 'development') {
          // Confirmation notifications sent to customer
        }
        break;
        
      case 'cancelled':
      case 'rejected':
        // Simulate cancellation notifications
        if (process.env.NODE_ENV === 'development') {
          // Status update notifications sent to customer
        }
        break;
        
      case 'completed':
        // Simulate completion and review request
        if (process.env.NODE_ENV === 'development') {
          // Review request sent to customer
        }
        break;
    }
    
    // Simulate salon notification
    if (process.env.NODE_ENV === 'development') {
      // Salon notification sent for booking status update
    }
    
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}