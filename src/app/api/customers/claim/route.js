import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/validation';
import { getCorsHeaders } from '@/lib/cors';
import { normalizePhone } from '@/lib/identity';

// OPTIONS preflight
export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(request.headers.get('origin')) });
}

// POST /api/customers/claim - attach auth user to existing guest customer
// Body may include: { customer_id } OR { phone/email/name }
export async function POST(request) {
  try {
    const body = await request.json();
    const { customer_id, phone, email, name } = body;

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 401, null, ERROR_CODES.UNAUTHORIZED),
        { status: 401 }
      );
    }

    const normalizedPhone = phone ? normalizePhone(phone) : null;

    // Invoke SECURITY DEFINER function
    const { data, error } = await supabase.rpc('claim_guest_customer', {
      p_customer_id: customer_id || null,
      p_phone: normalizedPhone,
      p_email: email || null,
      p_name: name || null,
    });

    if (error) {
      const raw = error.message || '';
      if (raw.includes('UNAUTHORIZED')) {
        return NextResponse.json(createErrorResponse('Authentication required', 401, null, ERROR_CODES.UNAUTHORIZED), { status: 401 });
      }
      if (raw.includes('ACCOUNT_EXISTS')) {
        return NextResponse.json(createErrorResponse('Account already claimed', 409, null, ERROR_CODES.ACCOUNT_EXISTS), { status: 409 });
      }
      if (raw.includes('CLAIM_CONFLICT')) {
        return NextResponse.json(createErrorResponse('Another account has claimed this profile', 409, null, ERROR_CODES.CLAIM_CONFLICT), { status: 409 });
      }
      if (raw.includes('CLAIM_NOT_FOUND')) {
        return NextResponse.json(createErrorResponse('Guest profile not found', 404, null, ERROR_CODES.CLAIM_NOT_FOUND), { status: 404 });
      }
      logger.error('claim_guest_customer RPC error:', error);
      return NextResponse.json(createErrorResponse('Failed to claim profile', 500, null, ERROR_CODES.INTERNAL_ERROR), { status: 500 });
    }

    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!result) {
      return NextResponse.json(createErrorResponse('Unexpected empty response', 500, null, ERROR_CODES.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse({ claimed_customer_id: result.claimed_customer_id, bookings_updated: result.bookings_updated }, 'Profile claimed successfully'),
      { status: 200, headers: getCorsHeaders(request.headers.get('origin')) }
    );
  } catch (err) {
    logger.error('Claim API error:', err);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, null, ERROR_CODES.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
