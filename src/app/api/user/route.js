import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/user
 * Simple endpoint to check if user is authenticated
 * Returns { user: { id, email } } if logged in, or { user: null } if not
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ user: null }, { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      });
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      }
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    console.error('Error checking user auth:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

