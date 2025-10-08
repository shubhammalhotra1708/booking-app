import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ShopSchema, validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // Validate input data
    const validation = validateRequest(ShopSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(validation.error, 400, validation.details),
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    // Insert shop with validated data
    const { data: shop, error: shopError } = await supabase.from('Shop').insert({
      name: validatedData.shopName,
      address: validatedData.shopAddress,
      phone: [validatedData.shopPhone],
      about: validatedData.shopAbout || null,
      image: validatedData.shopImage || null,
      rating: validatedData.shopRating || 4.5
    }).select('id').single();
    
    if (shopError) {
      console.error('Shop creation error:', shopError);
      return NextResponse.json(
        createErrorResponse('Failed to create shop', 500, shopError.message),
        { status: 500 }
      );
    }
    
    // Insert services if provided
    if (validatedData.services && validatedData.services.length > 0) {
      const shopId = shop.id;
      const servicesToInsert = validatedData.services.map(s => ({ 
        ...s, 
        shop_id: shopId // Use correct column name
      }));
      const { error: serviceError } = await supabase.from('Service').insert(servicesToInsert);
      
      if (serviceError) {
        console.error('Service creation error:', serviceError);
        // Don't fail the whole request if services fail, just log it
        console.warn('Shop created successfully but services failed:', serviceError.message);
      }
    }
    
    return NextResponse.json(createSuccessResponse({ shopId: shop.id }, 'Shop created successfully'));
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, err.message),
      { status: 500 }
    );
  }
}
