'use client';

import { createClient } from '@/utils/supabase/client';

/**
 * Client-side auth helpers for Supabase
 * These are used in client components like forms
 */

const supabase = createClient();

/**
 * Sign up new user with email and password
 */
export async function signUpWithEmail({ email, password, name, phone, tempAccount = false }) {
  // Client-side validation
  if (password.length < 6) {
    return { 
      success: false, 
      error: 'Password must be at least 6 characters long' 
    };
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        temp_account: tempAccount || undefined,
      },
    },
  });

  if (error) {
    return { 
      success: false, 
      error: error.message === 'User already registered' 
        ? 'An account with this email already exists. Please try logging in instead.'
        : 'Failed to create account. Please try again.' 
    };
  }

  // If email confirmation is disabled, session exists immediately - create Customer now (client-side)
  if (data.session && data.user) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Session created immediately - creating Customer record (client)...');
    }
    const customerResult = await ensureCustomerRecord({ name, email, phone });
    if (!customerResult?.success) {
      console.error('❌ Failed to create Customer record after signup', customerResult?.error);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Customer record created:', customerResult.data);
      }
    }

    // Stamp role=customer on the server (service-key admin API)
    try {
      await fetch('/api/auth/stamp-role', { method: 'POST' });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Could not stamp customer role (non-fatal):', e?.message || e);
      }
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏳ No session - email confirmation required');
    }
  }

  return { 
    success: true, 
    data,
    requiresEmailConfirmation: !data.session // true if email confirmation is enabled
  };
}

/**
 * Sign in existing user with email and password
 */
export async function signInWithEmail({ email, password }) {
  try {
    if (password.length < 6) {
      return { success: false, data: null, error: 'Password should be at least 6 characters' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, data: null, error: 'Invalid email or password' };
      }
      throw error;
    }
    if (data.user) {
      await ensureCustomerRecord();
    }
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Sign up with phone (creates email-based account using phone as identifier)
 */
export async function signUpWithPhone({ phone, password, name, tempAccount = false }) {
  // Client-side validation
  if (password.length < 6) {
    return { 
      success: false, 
      error: 'Password must be at least 6 characters long' 
    };
  }
    if (typeof window !== 'undefined') {
      window.__ensuringCustomer = false;
    }

  const supabase = createClient();
  
  // Normalize phone to digits and use a dummy email since Supabase requires email
  const normalizePhone = (p) => (p || '').toString().replace(/\D/g, '');
  const normalized = normalizePhone(phone);
  const dummyEmail = `${normalized}@phone.local`;
  
  const { data, error } = await supabase.auth.signUp({
    email: dummyEmail,
    password,
    options: {
      data: {
        name,
        phone,
        is_phone_signup: true,
        temp_account: tempAccount || undefined,
      },
    },
  });

  if (error) {
    return { 
      success: false, 
      error: 'Failed to create account. Please try again.' 
    };
  }

  // If email confirmation is disabled, session exists immediately - create Customer now (client-side)
  if (data.session && data.user) {
    console.log('✅ Session created immediately - creating Customer record (client)...');
  // Do not persist phone-alias emails into Customer; keep email null unless real
  const customerResult = await ensureCustomerRecord({ name, phone });
    if (!customerResult?.success) {
      console.error('❌ Failed to create Customer record after signup', customerResult?.error);
    } else {
      console.log('✅ Customer record created:', customerResult.data);
    }
  } else {
    console.log('⏳ No session - email confirmation required');
  }

  return { 
    success: true, 
    data,
    requiresEmailConfirmation: !data.session
  };
}

/**
 * Sign in with phone
 */
export async function signInWithPhone({ phone, password }) {
  try {
    const normalizePhone = (p) => (p || '').toString().replace(/\D/g, '');
    const normalized = normalizePhone(phone);
    const emailFromPhone = `${normalized}@phone.local`;
    // First attempt: normalized form (preferred)
    const attempt = async (email) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    };

    let { data, error } = await attempt(emailFromPhone);
    if (error && error.message?.includes('Invalid login credentials')) {
      // Backward-compat attempt with raw phone (legacy accounts)
      const legacyEmail = `${phone}@phone.local`;
      const retry = await attempt(legacyEmail);
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      const msg = error.message?.includes('Invalid login credentials')
        ? 'No account found for that phone and password. Please sign up or try a different login method.'
        : 'Could not sign in right now. Please try again.';
      return { success: false, data: null, error: msg };
    }

    // Ensure customer record exists (client-side)
    if (data.user) {
      await ensureCustomerRecord();
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Phone sign in error:', error);
    return { success: false, data: null, error: 'Could not sign in right now. Please try again.' };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any localStorage sessions (backward compatibility and cleanup)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clientSession');
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  try {
    // First check if there's a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { user: null, error: null };
    }
    
    // If session exists, get the user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return { user, error: null };
  } catch (error) {
    console.error('Get user error:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Don't throw error if no session, just return null
    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }
    
    return { session, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error: error.message };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Ensure a Customer row exists for the currently authenticated user.
 * Runs on the client so RLS sees the user's JWT (auth.uid()).
 */
export async function ensureCustomerRecord(overrides = {}) {
  try {
    const supa = createClient();
    const { data: { session } } = await supa.auth.getSession();
    if (!session?.user) {
      return { success: false, data: null, error: 'No active session' };
    }
    const user = session.user;

    // Concurrency guard
    if (typeof window !== 'undefined') {
      if (window.__ensuringCustomer) {
        await new Promise(r => setTimeout(r, 120));
      }
      window.__ensuringCustomer = true;
    }

    // Check existing by user_id first
    const { data: existing, error: findErr } = await supa
      .from('Customer')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (findErr && findErr.code !== 'PGRST116') {
      console.warn('ensureCustomerRecord: find error', findErr);
    }
    if (existing) {
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: true, data: existing, error: null };
    }

    // Build payload
    // Sanitize email: never persist phone-alias like '@phone.local'
    const aliasEmail = (overrides.email || user.email || '').toString();
    const sanitizedEmail = aliasEmail.endsWith('@phone.local') ? null : (aliasEmail || null);

    const payload = {
      user_id: user.id,
      name: overrides.name || user.user_metadata?.name || 'Customer',
      email: sanitizedEmail,
      phone: overrides.phone || user.user_metadata?.phone || null,
    };

    // Pre-null fields that collide with someone else
    for (const field of ['email', 'phone']) {
      if (!payload[field]) continue;
      try {
        const { data: conflict } = await supa
          .from('Customer')
          .select('id,user_id')
          .eq(field, payload[field])
          .maybeSingle();
        if (conflict && conflict.user_id !== user.id) {
          payload[field] = null; // avoid unique violation
        }
      } catch {}
    }

    // Upsert on user_id
    let { data: upserted, error: upsertErr } = await supa
      .from('Customer')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (upsertErr) {
      const msg = upsertErr?.message || upsertErr?.hint || String(upsertErr);
      console.error('ensureCustomerRecord: upsert error', msg);
      // Retry stripping both email & phone if unique error
      if (msg.includes('Customer_email_key') || msg.includes('Customer_phone_key')) {
        const safePayload = { ...payload, email: null, phone: null };
        const retry = await supa
          .from('Customer')
          .upsert(safePayload, { onConflict: 'user_id' })
          .select('*')
          .single();
        if (!retry.error && retry.data) {
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: true, data: retry.data, error: null };
        }
        upsertErr = retry.error;
      }
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: false, data: null, error: upsertErr?.message || 'Failed to create customer' };
    }

    if (typeof window !== 'undefined') window.__ensuringCustomer = false;
    return { success: true, data: upserted, error: null };
  } catch (e) {
    console.error('ensureCustomerRecord: unexpected error', e);
    if (typeof window !== 'undefined') window.__ensuringCustomer = false;
    return { success: false, data: null, error: e.message };
  }
}
