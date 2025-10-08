import { NextResponse } from 'next/server';
import { createServiceClient } from '../../../../utils/supabase/service';

// GET /api/upload/images - Get shop images
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get shop images
    const { data: shop, error } = await supabase
      .from('Shop')
      .select('images')
      .eq('id', shopId)
      .single();

    if (error) {
      console.error('Error fetching shop images:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch shop images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        images: shop?.images || [],
        count: shop?.images?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in GET images:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch images',
        details: error.message 
      },
      { status: 500 }
    );
  }
}