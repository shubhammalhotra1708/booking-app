import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { createErrorResponse, createSuccessResponse } from '../../../lib/validation';

// Note: This API is designed for public access (booking app)  
// Make sure RLS policies allow public read access to Staff table

// GET /api/staff - Get staff for a shop who can perform a specific service
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const serviceId = searchParams.get('service_id');
    
    if (!shopId) {
      return NextResponse.json(
        createErrorResponse('Shop ID is required', 400),
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let staff = [];

    // If service_id is provided, filter staff by StaffService mapping
    if (serviceId) {
      logger.info(`Fetching staff for shop ${shopId} who can perform service ${serviceId}`);
      
      // First, get staff IDs from StaffService mapping
      const { data: staffServiceMappings, error: mappingError } = await supabase
        .from('StaffService')
        .select('staffid')
        .eq('serviceid', parseInt(serviceId));

      if (mappingError) {
        logger.error('Error fetching staff-service mappings:', mappingError);
        return NextResponse.json(
          createErrorResponse('Failed to fetch staff-service mappings', 500),
          { status: 500 }
        );
      }

      if (!staffServiceMappings || staffServiceMappings.length === 0) {
        logger.warn(`No staff assigned to service ${serviceId}`);
        return NextResponse.json(
          createSuccessResponse([], 'No staff available for this service'),
          { status: 200 }
        );
      }

      const staffIds = staffServiceMappings.map(m => m.staffid);
      logger.info(`Found ${staffIds.length} staff IDs for service ${serviceId}:`, staffIds);

      // Now get full staff details for these IDs
      const { data: staffData, error: staffError } = await supabase
        .from('Staff')
        .select(`
          id, name, role, specialties, experience, rating, gender, about, shop_id, profile_image_url
        `)
        .in('id', staffIds)
        .eq('shop_id', parseInt(shopId))
        .eq('is_active', true)
        .order('name');

      if (staffError) {
        logger.error('Error fetching staff details:', staffError);
        return NextResponse.json(
          createErrorResponse('Failed to fetch staff', 500),
          { status: 500 }
        );
      }

      staff = staffData || [];
      logger.info(`Returning ${staff.length} active staff for service ${serviceId}`);
      
    } else {
      // No service specified - return all active staff
      logger.info(`Fetching all active staff for shop ${shopId}`);
      
      const { data: staffData, error: staffError } = await supabase
        .from('Staff')
        .select(`
          id, name, role, specialties, experience, rating, gender, about, shop_id, profile_image_url
        `)
        .eq('shop_id', parseInt(shopId))
        .eq('is_active', true)
        .order('name');

      if (staffError) {
        logger.error('Error fetching staff:', staffError);
        return NextResponse.json(
          createErrorResponse('Failed to fetch staff', 500),
          { status: 500 }
        );
      }

      staff = staffData || [];
      logger.info(`Returning ${staff.length} active staff`);
    }

    // Remove duplicate staff (in case of data inconsistencies)
    const uniqueStaff = staff.reduce((acc, current) => {
      const exists = acc.find(item => item.id === current.id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    return NextResponse.json(
      createSuccessResponse(uniqueStaff, 'Staff retrieved successfully'),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
        }
      }
    );

  } catch (error) {
    logger.error('Staff API Error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}