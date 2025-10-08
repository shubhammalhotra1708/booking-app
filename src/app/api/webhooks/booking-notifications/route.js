// Webhook implementation for booking notifications
// src/app/api/webhooks/booking-notifications/route.js

export async function POST(request) {
    try {
        const { type, record, old_record } = await request.json();
        
        // Verify webhook signature (security)
        const signature = request.headers.get('x-supabase-signature');
        // Add signature verification logic here
        
        switch (type) {
            case 'INSERT':
                if (record.table === 'bookings') {
                    await handleNewBooking(record);
                }
                break;
                
            case 'UPDATE':
                if (record.table === 'bookings' && old_record.status !== record.status) {
                    await handleBookingStatusChange(record, old_record);
                }
                break;
        }
        
        return Response.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: 'Webhook failed' }, { status: 500 });
    }
}

async function handleNewBooking(booking) {
    // Send email to salon admin
    await sendEmail({
        to: booking.shop_email,
        subject: `New Booking Request - ${booking.customer_name}`,
        template: 'new-booking-request',
        data: booking
    });
    
    // Send confirmation to customer
    await sendEmail({
        to: booking.customer_email,
        subject: 'Booking Request Received',
        template: 'booking-received',
        data: booking
    });
}

async function handleBookingStatusChange(booking, oldBooking) {
    if (booking.status === 'confirmed') {
        await sendEmail({
            to: booking.customer_email,
            subject: 'Booking Confirmed!',
            template: 'booking-confirmed',
            data: booking
        });
    } else if (booking.status === 'rejected') {
        await sendEmail({
            to: booking.customer_email,
            subject: 'Booking Update',
            template: 'booking-rejected',
            data: booking
        });
    }
}

async function sendEmail({ to, subject, template, data }) {
    // Using a service like Resend, SendGrid, or Supabase Edge Functions
    // Implementation depends on your email provider
    // Email notification sent (production would use real email service)
}