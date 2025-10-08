import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/validation';

/**
 * Authentication middleware helper
 * Checks if user is authenticated and optionally has required permissions
 */
export async function requireAuth(request, options = {}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth error:', authError);
      }
      return {
        success: false,
        response: NextResponse.json(
          createErrorResponse('Authentication failed', 401),
          { status: 401 }
        )
      };
    }
    
    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          createErrorResponse('Authentication required', 401),
          { status: 401 }
        )
      };
    }
    
    // Optional: Check user roles or permissions
    if (options.requiredRole) {
      // In future, you can add role-based checks here
      // const userRole = user.user_metadata?.role;
      // if (userRole !== options.requiredRole) { ... }
    }
    
    return {
      success: true,
      user
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth middleware error:', error);
    }
    return {
      success: false,
      response: NextResponse.json(
        createErrorResponse('Authentication error', 500),
        { status: 500 }
      )
    };
  }
}

/**
 * Optional authentication - doesn't fail if user is not authenticated
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export async function optionalAuth(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return {
      success: true,
      user: error ? null : user
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Optional auth error:', error);
    }
    return {
      success: true,
      user: null
    };
  }
}