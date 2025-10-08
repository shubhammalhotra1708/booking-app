import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

// PUT /api/admin/shops - Update shop details (admin only)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { shop_id, operating_hours, ...otherUpdates } = body;
    
    if (!shop_id) {
      return NextResponse.json(
        createErrorResponse('Shop ID is required', 400),
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Update shop data
    const { data: updatedShop, error: updateError } = await supabase
      .from('Shop')
      .update({
        ...otherUpdates,
        ...(operating_hours && { operating_hours }),
        updated_at: new Date().toISOString()
      })
      .eq('id', shop_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shop:', updateError);
      return NextResponse.json(
        createErrorResponse('Failed to update shop', 500),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(updatedShop, 'Shop updated successfully'),
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