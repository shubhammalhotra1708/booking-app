import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews?shop_id={id}&limit=10&offset=0
 * Get approved reviews for a shop (public endpoint)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const staffId = searchParams.get('staff_id');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;
    
    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shop_id is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Build query for approved reviews only
    let query = supabase
      .from('Review')
      .select(`
        id,
        rating,
        staff_rating,
        title,
        comment,
        reviewer_name,
        is_verified_customer,
        created_at,
        owner_response,
        owner_response_at,
        Staff:staff_id (id, name)
      `, { count: 'exact' })
      .eq('shop_id', shopId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Optional staff filter
    if (staffId) {
      query = query.eq('staff_id', staffId);
    }
    
    const { data: reviews, error, count } = await query;
    
    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
    
    // Get rating statistics
    const { data: allReviews } = await supabase
      .from('Review')
      .select('rating')
      .eq('shop_id', shopId)
      .eq('is_approved', true);
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    
    (allReviews || []).forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating]++;
        totalRating += r.rating;
      }
    });
    
    const totalReviews = allReviews?.length || 0;
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;
    
    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        averageRating: parseFloat(averageRating),
        totalReviews,
        distribution
      },
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });
    
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Submit a new review
 *
 * Two modes:
 * 1. Token-based (from invoice email): { token, shop_rating, ... }
 * 2. Logged-in user (from salon page): { shop_id, shop_rating, ... } - requires auth
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, shop_id, shop_rating, staff_rating, comment, title } = body;

    // Validate rating
    if (!shop_rating || shop_rating < 1 || shop_rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Determine which mode: token-based or logged-in user
    if (token) {
      // ========== TOKEN-BASED REVIEW (from invoice email) ==========
      const supabase = createServiceClient();

      // Verify token and get review request
      const { data: reviewRequest, error: tokenError } = await supabase
        .from('ReviewRequest')
        .select(`*, Shop:shop_id (id, name)`)
        .eq('token', token)
        .single();

      if (tokenError || !reviewRequest) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired review link' },
          { status: 400 }
        );
      }

      // Check if expired
      if (new Date(reviewRequest.expires_at) < new Date()) {
        await supabase
          .from('ReviewRequest')
          .update({ status: 'expired' })
          .eq('id', reviewRequest.id);

        return NextResponse.json(
          { success: false, error: 'This review link has expired' },
          { status: 400 }
        );
      }

      // Check if already completed
      if (reviewRequest.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Review already submitted for this service' },
          { status: 400 }
        );
      }

      // Create the review
      const { data: review, error: reviewError } = await supabase
        .from('Review')
        .insert({
          shop_id: reviewRequest.shop_id,
          invoice_id: reviewRequest.invoice_id,
          customer_id: reviewRequest.customer_id,
          staff_id: reviewRequest.staff_id,
          rating: shop_rating,
          staff_rating: staff_rating || null,
          title: title || null,
          comment: comment || null,
          reviewer_name: reviewRequest.customer_name || 'Anonymous',
          reviewer_email: reviewRequest.customer_email || null,
          is_verified_customer: true,
          is_approved: true
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Error creating review:', reviewError);
        if (reviewError.code === '23505') {
          return NextResponse.json(
            { success: false, error: 'Review already submitted for this service' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Failed to submit review' },
          { status: 500 }
        );
      }

      // Mark review request as completed
      await supabase
        .from('ReviewRequest')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', reviewRequest.id);

      return NextResponse.json({
        success: true,
        message: 'Thank you for your feedback!',
        review: { id: review.id, rating: review.rating, staff_rating: review.staff_rating }
      });

    } else if (shop_id) {
      // ========== LOGGED-IN USER REVIEW (from salon page) ==========
      const supabase = await createClient();

      // Check if user is logged in
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Please log in to leave a review' },
          { status: 401 }
        );
      }

      // Get customer record for this user
      const { data: customer } = await supabase
        .from('Customer')
        .select('id, name, email')
        .eq('user_id', user.id)
        .single();

      // Create the review (use service client to bypass RLS for insert)
      const serviceSupabase = createServiceClient();

      const { data: review, error: reviewError } = await serviceSupabase
        .from('Review')
        .insert({
          shop_id: shop_id,
          customer_id: customer?.id || null,
          rating: shop_rating,
          staff_rating: staff_rating || null,
          title: title || null,
          comment: comment || null,
          reviewer_name: customer?.name || user.email?.split('@')[0] || 'Customer',
          reviewer_email: customer?.email || user.email,
          is_verified_customer: true, // Logged-in user = verified
          is_approved: true
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Error creating review:', reviewError);
        if (reviewError.code === '23505') {
          return NextResponse.json(
            { success: false, error: 'You have already reviewed this salon' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Failed to submit review' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you for your review!',
        review: { id: review.id, rating: review.rating }
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Either token or shop_id is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

