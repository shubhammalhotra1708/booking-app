import { logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Add caching for static data
export const revalidate = 300; // 5 minutes cache

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('Service')
      .select('*')
      .order('name');
    
    // If shop_id is provided, filter by shop
    if (shopId) {
      query = query.eq('shop_id', parseInt(shopId));
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch services', 500, error.message),
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(data || [], 'Services retrieved successfully'),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, error.message),
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    
    // First, let's check what columns exist in Shop table
    const { data: existingShops, error: shopError } = await supabase
      .from('Shop')
      .select('*')
      .limit(3)

    logger.debug('Shop table check:', { existingShops, shopError })

    let shopIds = []
    
    if (shopError) {
      return NextResponse.json({ 
        success: false, 
        error: `Shop table error: ${shopError.message}`,
        suggestion: 'Make sure your Shop table exists'
      }, { status: 500 })
    }
    
    if (!existingShops || existingShops.length === 0) {
      // Create some basic shops first with minimal data
      const shopsToInsert = [
        { name: 'Test Shop 1' },
        { name: 'Test Shop 2' },
        { name: 'Test Shop 3' }
      ]

      const { data: newShops, error: insertShopError } = await supabase
        .from('Shop')
        .insert(shopsToInsert)
        .select('id')

      if (insertShopError) {
        logger.error('Error inserting shops:', insertShopError)
        return NextResponse.json({ 
          success: false, 
          error: `Error creating shops: ${insertShopError.message}`,
          suggestion: 'Check Shop table structure and permissions'
        }, { status: 500 })
      } else {
        shopIds = newShops?.map(shop => shop.id) || []
      }
    } else {
      shopIds = existingShops.map(shop => shop.id)
    }

    // Now insert basic services using the existing Shop IDs
    if (shopIds.length > 0) {
      const servicesToInsert = [
        // Basic services for testing
        {
          id: shopIds[0],
          name: 'Haircut',
          price: 50.00,
          description: 'Basic haircut service',
          discount: 0,
          targetGender: ['ALL'],
          duration: 45,
          rating: 4.5
        },
        {
          id: shopIds[0],
          name: 'Hair Wash',
          price: 25.00,
          description: 'Hair washing service',
          discount: 5,
          targetGender: ['ALL'],
          duration: 20,
          rating: 4.0
        },
        {
          id: shopIds[1] || shopIds[0],
          name: 'Manicure',
          price: 35.00,
          description: 'Nail care service',
          discount: 0,
          targetGender: ['WOMEN'],
          duration: 60,
          rating: 4.3
        },
        {
          id: shopIds[2] || shopIds[0],
          name: 'Massage',
          price: 80.00,
          description: 'Relaxing massage',
          discount: 10,
          targetGender: ['ALL'],
          duration: 90,
          rating: 4.8
        }
      ]

      const { data: services, error: servicesError } = await supabase
        .from('Service')
        .insert(servicesToInsert)
        .select('*')

      if (servicesError) {
        logger.error('Error inserting services:', servicesError)
        return NextResponse.json({ 
          success: false, 
          error: servicesError.message,
          details: 'Failed to insert services'
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Services added successfully!',
        data: {
          shopsUsed: shopIds.length,
          servicesAdded: services?.length || 0,
          services: services
        }
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No shop IDs available to link services to'
      }, { status: 400 })
    }

  } catch (error) {
    logger.error('Setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
