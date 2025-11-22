import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/validation';

// POST /api/auth/upgrade { email, password, name?, phone? }
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;
    if (!email || !password) {
      return NextResponse.json(createErrorResponse('Email & password required', 400, null, ERROR_CODES.VALIDATION_FAILED), { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(createErrorResponse('Password too short', 400, null, ERROR_CODES.VALIDATION_FAILED), { status: 400 });
    }
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(createErrorResponse('Not authenticated', 401, null, ERROR_CODES.UNAUTHORIZED), { status: 401 });
    }
    if (!authUser.user_metadata?.anonymous) {
      return NextResponse.json(createErrorResponse('Account already upgraded', 409, null, ERROR_CODES.ACCOUNT_EXISTS), { status: 409 });
    }

    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
      data: {
        ...authUser.user_metadata,
        anonymous: false,
        temp_account: false,
        name: name || authUser.user_metadata?.name || 'Customer',
        phone: phone || authUser.user_metadata?.phone || null,
      }
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('already registered')) {
        return NextResponse.json(createErrorResponse('Email already in use', 409, null, ERROR_CODES.ACCOUNT_EXISTS), { status: 409 });
      }
      return NextResponse.json(createErrorResponse('Upgrade failed', 500, null, ERROR_CODES.INTERNAL_ERROR), { status: 500 });
    }

    // Ensure Customer row updated with real email if provided
    const realEmail = email.endsWith('@phone.local') ? null : email;
    await supabase.from('Customer').update({ email: realEmail }).eq('user_id', authUser.id);

    return NextResponse.json(createSuccessResponse({ user: data.user }, 'Account upgraded'), { status: 200 });
  } catch (err) {
    logger.error('Upgrade route error', err);
    return NextResponse.json(createErrorResponse('Internal server error', 500, null, ERROR_CODES.INTERNAL_ERROR), { status: 500 });
  }
}
