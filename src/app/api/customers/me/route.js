import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/validation';
import { normalizePhone } from '@/lib/identity';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(createErrorResponse('Not authenticated', 401, null, ERROR_CODES.UNAUTHORIZED), { status: 401 });
    }

    // Attempt to resolve Customer by user_id
    const { data: customer } = await supabase
      .from('Customer')
      .select('id, name, email, phone_normalized, phone, created_at, user_id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    let resolved = customer || null;

    // If no direct match but metadata has phone/email attempt fallback search
    if (!resolved) {
      const rawPhone = authUser.user_metadata?.phone || null;
      const email = authUser.email || null;
      let phoneNormalized = rawPhone ? normalizePhone(rawPhone) : null;
      if (phoneNormalized) {
        const { data: phoneCustomer } = await supabase
          .from('Customer')
          .select('id, name, email, phone_normalized, phone, created_at, user_id')
          .eq('phone_normalized', phoneNormalized)
          .maybeSingle();
        if (phoneCustomer) resolved = phoneCustomer;
      }
      if (!resolved && email) {
        const { data: emailCustomer } = await supabase
          .from('Customer')
          .select('id, name, email, phone_normalized, phone, created_at, user_id')
          .eq('email', email)
          .maybeSingle();
        if (emailCustomer) resolved = emailCustomer;
      }
    }

    const tempAccount = !!authUser.user_metadata?.tempAccount;

    return NextResponse.json(createSuccessResponse({
      auth_user_id: authUser.id,
      auth_email: authUser.email,
      auth_metadata: authUser.user_metadata,
      customer: resolved,
      flags: {
        tempAccount,
        canClaimProfile: !resolved && (authUser.user_metadata?.phone || authUser.email),
      }
    }, 'Profile resolved'));
  } catch (err) {
    logger.error('customers/me error', err);
    return NextResponse.json(createErrorResponse('Internal server error', 500, null, ERROR_CODES.INTERNAL_ERROR), { status: 500 });
  }
}
