import { createServiceClient } from '@/utils/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews/verify?token={token}
 * Verify a review request token and return service details
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Use service client to bypass RLS
    const supabase = createServiceClient();
    
    // Get review request with shop and staff info
    const { data: reviewRequest, error } = await supabase
      .from('ReviewRequest')
      .select(`
        id,
        status,
        expires_at,
        customer_name,
        service_name,
        staff_id,
        Shop:shop_id (
          id,
          name,
          logo_url,
          image
        ),
        Staff:staff_id (
          id,
          name,
          profile_image_url
        )
      `)
      .eq('token', token)
      .single();
    
    if (error || !reviewRequest) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Invalid review link'
      }, { status: 404 });
    }
    
    // Check if expired
    const isExpired = new Date(reviewRequest.expires_at) < new Date();
    
    if (isExpired && reviewRequest.status === 'pending') {
      // Update status to expired
      await supabase
        .from('ReviewRequest')
        .update({ status: 'expired' })
        .eq('id', reviewRequest.id);
    }
    
    // Check if already completed or expired
    if (reviewRequest.status === 'completed') {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Review already submitted',
        status: 'completed'
      });
    }
    
    if (isExpired || reviewRequest.status === 'expired') {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'This review link has expired',
        status: 'expired'
      });
    }
    
    if (reviewRequest.status === 'skipped') {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'This review request was skipped',
        status: 'skipped'
      });
    }
    
    // Mark as opened if not already
    await supabase
      .from('ReviewRequest')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', reviewRequest.id)
      .is('opened_at', null);
    
    // Return valid request details
    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        customerName: reviewRequest.customer_name,
        serviceName: reviewRequest.service_name,
        shop: {
          id: reviewRequest.Shop.id,
          name: reviewRequest.Shop.name,
          logo: reviewRequest.Shop.logo_url || reviewRequest.Shop.image
        },
        staff: reviewRequest.Staff ? {
          id: reviewRequest.Staff.id,
          name: reviewRequest.Staff.name,
          image: reviewRequest.Staff.profile_image_url
        } : null,
        canRateStaff: !!reviewRequest.staff_id
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

