import { logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get('shop_id');
    const service_id = searchParams.get('service_id');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!shop_id || !service_id || !date || !time) {
      return Response.json({
        success: false,
        message: 'Missing required parameters'
      }, { status: 400 });
    }

    const supabase = createClient();

    // Get all staff members for this shop who can perform this service
    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select(`
        id,
        name,
        specialization,
        working_hours
      `)
      .eq('shop_id', shop_id)
      .eq('is_active', true);

    if (staffError) {
      logger.error('Staff query error:', staffError);
      return Response.json({
        success: false,
        message: 'Failed to fetch staff'
      }, { status: 500 });
    }

    if (!staff || staff.length === 0) {
      return Response.json({
        success: true,
        data: { staff: [] }
      });
    }

    // Check if staff members are available at the requested time
    // For now, we'll just return all active staff
    // In production, you'd check against actual bookings and working hours
    const availableStaff = staff.map(member => ({
      id: member.id,
      name: member.name,
      specialization: member.specialization,
      isAvailable: true // Simplified - in production, check against bookings
    }));

    return Response.json({
      success: true,
      data: {
        staff: availableStaff,
        date,
        time
      }
    });

  } catch (error) {
    logger.error('Staff availability API error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}