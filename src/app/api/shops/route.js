import { logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Note: This API is designed for public access (booking app)
// Make sure RLS policies allow public read access to Shop table

// Cache for 5 minutes for shop listings
export const revalidate = 300;

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const shopId = searchParams.get('shop_id');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const basic = searchParams.get('basic') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const includeServices = searchParams.get('include_services'); // 'basic' | 'full' | null
    
    // SECURITY: Only expose customer-facing data, hide sensitive admin info
    let selectFields = `
      id,
      name,
      about,
      address,
      city,
      state,
      image,
      rating,
      review_count,
      price_range,
      is_verified
    `;
    
    // Add service data if requested (commented out for performance - causing 10+ second delays)
    // TODO: Optimize this query or create a separate endpoint for services
    // if (includeServices === 'basic') {
    //   selectFields += `,
    //     Service!inner(
    //       id,
    //       name,
    //       category,
    //       price
    //     )
    //   `;
    // } else if (includeServices === 'full') {
    //   selectFields += `,
    //     Service(
    //       id,
    //       name,
    //       category,
    //       price,
    //       duration,
    //       description
    //     )
    //   `;
    // }
    
    // Add extra fields for non-basic requests
    if (!basic) {
      selectFields += `,
        phone,
        email,
        next_available,
        operating_hours,
        special_offer
      `;
    }
    
    let query = supabase
      .from('Shop')
      .select(selectFields)
      .eq('is_active', true);
      // Removed .eq('is_verified', true) - now handled by RLS policies
    
    // Add filters if provided
    if (shopId) {
      query = query.eq('id', shopId);
    } else {
      // Featured shops filter (high rating, verified, etc.)
      // TODO: Add 'featured' boolean column to Shop table for better control
      if (featured) {
        query = query
          .order('rating', { ascending: false })
          .order('review_count', { ascending: false })
          .limit(10); // Top 10 shops for now
      }
      
      // Only apply pagination and ordering if not fetching specific shop
      query = query
        .range(offset, offset + limit - 1)
        .order('rating', { ascending: false });
    }
    
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch shops', 500, error.message),
        { status: 500 }
      );
    }
    
    // No service processing needed for performance
    let processedData = data;
    
    return NextResponse.json(
      createSuccessResponse(processedData, 'Shops retrieved successfully'),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'X-Total-Count': processedData.length.toString()
        },
      }
    );
  } catch (error) {
    logger.error('Shops API error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, error.message),
      { status: 500 }
    );
  }
}