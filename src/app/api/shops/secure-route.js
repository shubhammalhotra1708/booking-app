// OPTION 3: API Key Authentication for Booking App (optional pattern)
// This route is intended for server-to-server use only. It gates access with an x-api-key
// and then uses a Supabase service client for privileged reads. If you don't need this
// pattern, you can delete this file.

import { createServiceClient } from '@/utils/supabase/service'
import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

// API Key validation middleware
function validateApiKey(request) {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.BOOKING_APP_API_KEY;
  
  if (!apiKey || !validApiKey) {
    return { valid: false, error: 'Missing API key configuration' };
  }
  
  if (apiKey !== validApiKey) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  return { valid: true };
}

export async function GET(request) {
  try {
    // Validate API key
    const { valid, error } = validateApiKey(request);
    if (!valid) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 401, error),
        { status: 401 }
      );
    }

    // Use service role for controlled access
    const supabase = createServiceClient();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    
    const { data, error: dbError } = await supabase
      .from('Shop')
      .select(`
        id, name, about, address, city, state, image, rating, 
        review_count, price_range, next_available, operating_hours
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .range(offset, offset + limit - 1)
      .order('rating', { ascending: false });
    
    if (dbError) {
      return NextResponse.json(
        createErrorResponse('Failed to fetch shops', 500, dbError.message),
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(data, 'Shops retrieved successfully')
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, error.message),
      { status: 500 }
    );
  }
}