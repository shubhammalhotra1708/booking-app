import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/validation';
import { getCorsHeaders } from '@/lib/cors';
import { normalizePhone } from '@/lib/identity';

// OPTIONS for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(request.headers.get('origin')) });
}

// POST /api/claim-customer
// Body may include: { customer_id? | (phone?, email?), name? }
// Attaches authenticated user to guest customer and backfills bookings
export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 401, null, ERROR_CODES.UNAUTHORIZED),
        { status: 401 }
      );
    }

    const customerId = body.customer_id || null;
    const rawPhone = body.phone || null;
    const email = body.email || null;
    const name = body.name || null;

    if (!customerId && !rawPhone && !email) {
      return NextResponse.json(
        createErrorResponse('customer_id or phone/email is required', 400, null, ERROR_CODES.VALIDATION_FAILED),
        { status: 400 }
      );
    }

    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    const { data, error } = await supabase.rpc('claim_guest_customer', {
      p_customer_id: customerId,
      p_phone: phone,
      p_email: email,
      p_name: name,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('UNAUTHORIZED')) {
        return NextResponse.json(
          createErrorResponse('Authentication required', 401, null, ERROR_CODES.UNAUTHORIZED),
          { status: 401 }
        );
      }
      if (msg.includes('CLAIM_NOT_FOUND')) {
        return NextResponse.json(
          createErrorResponse('Guest customer not found', 404, null, ERROR_CODES.CLAIM_NOT_FOUND),
          { status: 404 }
        );
      }
      if (msg.includes('ACCOUNT_EXISTS')) {
        return NextResponse.json(
          createErrorResponse('Account already claimed by another user', 409, null, ERROR_CODES.ACCOUNT_EXISTS),
          { status: 409 }
        );
      }
      if (msg.includes('CLAIM_CONFLICT')) {
        return NextResponse.json(
          createErrorResponse('Claim conflict: existing claimed account shares phone/email', 409, null, ERROR_CODES.CLAIM_CONFLICT),
          { status: 409 }
        );
      }
      logger.error('Claim RPC error:', error);
      return NextResponse.json(
        createErrorResponse('Failed to claim customer', 500, null, ERROR_CODES.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    const payload = Array.isArray(data) && data.length > 0 ? data[0] : data;
    return NextResponse.json(
      createSuccessResponse(payload, 'Customer claimed successfully'),
      { status: 200, headers: getCorsHeaders(request.headers.get('origin')) }
    );
  } catch (err) {
    logger.error('Claim endpoint error:', err);
    return NextResponse.json(
      createErrorResponse('Internal server error', 500, null, ERROR_CODES.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
