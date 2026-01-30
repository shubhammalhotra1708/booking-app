import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Add caching for static data
export const revalidate = 300; // 5 minutes cache

/**
 * GET /api/products
 * Fetch products for a shop (public endpoint for booking-app)
 * Only returns active products with available stock
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shop_id is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();

    console.log(`📦 Fetching products for shop_id: ${shopId}`);

    // Fetch only active products for the shop
    let query = supabase
      .from('Product')
      .select('id, name, description, price, image_url, category, quantity, track_inventory')
      .eq('shop_id', parseInt(shopId))
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    const { data, error } = await query;

    console.log(`📦 Products query result:`, { data, error });

    if (error) {
      console.error('Database error fetching products:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      );
    }
    
    // Filter out products with no stock (if tracking inventory)
    const availableProducts = (data || []).filter(product => {
      if (!product.track_inventory) return true;
      return product.quantity > 0;
    });
    
    return NextResponse.json(
      { success: true, data: availableProducts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

