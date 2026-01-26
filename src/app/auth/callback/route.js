import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Auth callback handler for email OTP and magic link authentication
 * 
 * This route is called when users click email verification links.
 * Supabase redirects here with auth tokens in the URL, which we exchange for a session.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/my-bookings';
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      `${requestUrl.origin}/client-dashboard?error=${encodeURIComponent(error_description || 'Authentication failed')}`
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookieOptions: {
          name: 'sb-booking-auth',
          lifetime: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          sameSite: 'lax',
        },
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/client-dashboard?error=${encodeURIComponent('Failed to verify email')}`
        );
      }

      if (data.session) {
        console.log('✅ Email verified and session created for:', data.user?.email);
        
        // Stamp customer role via API
        try {
          await fetch(`${requestUrl.origin}/api/auth/stamp-role`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
            },
          });
        } catch (stampErr) {
          console.warn('Failed to stamp customer role:', stampErr);
          // Non-fatal, continue
        }

        // Redirect to my-bookings or requested next page
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/client-dashboard?error=${encodeURIComponent('An error occurred during verification')}`
      );
    }
  }

  // No code provided - redirect to dashboard
  return NextResponse.redirect(`${requestUrl.origin}/client-dashboard`);
}
