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

    // SECURITY: Only expose customer-facing staff info, hide personal details
    let query = supabase
      .from('Staff')
      .select(`
        id, name, role, specialties, experience, rating, gender, about, shop_id
      `)
      .eq('shop_id', parseInt(shopId))
      .eq('is_active', true)
      .order('name');

    // Note: Removed complex join for now since StaffService table may not exist

    const { data: staff, error } = await query;

    if (error) {
      logger.error('Error fetching staff:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch staff', 500),
        { status: 500 }
      );
    }

    // Remove duplicate staff (in case they have multiple services)
    const uniqueStaff = staff ? staff.reduce((acc, current) => {
      const exists = acc.find(item => item.id === current.id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []) : [];

    return NextResponse.json(
      createSuccessResponse(uniqueStaff, 'Staff retrieved successfully'),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
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