import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    // Insert shop
    const { data: shop, error: shopError } = await supabase.from('Shop').insert({
      name: body.shopName,
      address: body.shopAddress,
      phone: [body.shopPhone],
      about: body.shopAbout,
      image: body.shopImage,
      rating: body.shopRating
    }).select('id').single();
    if (shopError) throw shopError;
    // Insert services
    const shopId = shop.id;
    const servicesToInsert = body.services.map(s => ({ ...s, id: shopId }));
    const { error: serviceError } = await supabase.from('Service').insert(servicesToInsert);
    if (serviceError) throw serviceError;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
