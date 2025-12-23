'use client';

import { createClient } from '@/utils/supabase/client';
import { normalizePhone } from '@/lib/identity';
import { logger } from '@/lib/logger';

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
    logger.debug('✅ Session created immediately - creating Customer record (client)...');
        const customerResult = await ensureCustomerRecord({ name, email, phone });
    if (!customerResult?.success) {
      logger.error('❌ Failed to create Customer record after signup', customerResult?.error);
      
      // If phone/email conflict, sign out and fail
      if (customerResult?.error === 'ACCOUNT_EXISTS') {
        await supabase.auth.signOut();
        return { success: false, error: 'Phone/email already registered' };
      }
    } else {
      logger.debug('✅ Customer record created:', customerResult.data);
    }
    // Stamp role=customer on the server (service-key admin API)
    try {
      await fetch('/api/auth/stamp-role', { method: 'POST' });
    } catch (e) {
      logger.warn('Could not stamp customer role (non-fatal):', e?.message || e);
    }
  } else {
    logger.debug('⏳ No session - email confirmation required');
  }

  return { 
    success: true, 
    data,
    requiresEmailConfirmation: !data.session // true if email confirmation is enabled
  };
}

/**
 * Start (or reuse) an anonymous session.
 * Supabase anonymous auth creates a user row without credentials.
 * We mark metadata anonymous=true for later upgrade.
 */
export async function signInAnonymously() {
  try {
    const supa = createClient();
    const { data, error } = await supa.auth.signInAnonymously();
    if (error) {
      return { success: false, error: error.message };
    }
    // Tag metadata if not already present
    if (data?.user && !data.user.user_metadata?.anonymous) {
      await supa.auth.updateUser({
        data: { ...data.user.user_metadata, anonymous: true, temp_account: true }
      });
    }
    return { success: true, data };
  } catch (e) {
    logger.error('Anonymous sign-in failed', e);
    return { success: false, error: e.message };
  }
}

/**
 * Upgrade an anonymous account to an email/password credentialed account.
 * Requires active anonymous session.
 */
export async function upgradeAnonymousAccount({ email, password, name, phone }) {
  try {
    const supa = createClient();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return { success: false, error: 'No active session' };
    if (!user.user_metadata?.anonymous) {
      return { success: false, error: 'Account already upgraded' };
    }
    if (!email || !password) {
      return { success: false, error: 'Email & password required' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    // updateUser can set email & password
    const { data, error } = await supa.auth.updateUser({
      email,
      password,
      data: {
        ...user.user_metadata,
        anonymous: false,
        temp_account: false,
        name: name || user.user_metadata?.name || 'Customer',
        phone: phone || user.user_metadata?.phone || null,
      }
    });
    if (error) {
      logger.error('❌ upgradeAnonymousAccount error:', error);
      // Check for specific error codes
      if (error.message?.includes('email_exists') || error.status === 422) {
        return { 
          success: false, 
          error: 'This email is already registered. Please sign in with your existing account or use a different email.',
          code: 'email_exists'
        };
      }
      return { success: false, error: error.message };
    }
    
    logger.debug('✅ Anonymous user upgraded to permanent account');
    
    // Update Customer record with email/phone if not already set
    const { data: existingCustomer } = await supa
      .from('Customer')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingCustomer) {
      const updates = {};
      if (email && !existingCustomer.email) updates.email = email;
      if (phone && !existingCustomer.phone) updates.phone = phone;
      if (name && !existingCustomer.name) updates.name = name;
      
      if (Object.keys(updates).length > 0) {
        const phoneNorm = phone ? normalizePhone(phone) : null;
        if (phoneNorm) updates.phone_normalized = phoneNorm;
        
        const { error: updateErr } = await supa
          .from('Customer')
          .update(updates)
          .eq('user_id', user.id);
        
        if (updateErr) {
          logger.error('Failed to update Customer with new email/phone:', updateErr);
        } else {
          logger.debug('✅ Customer record updated with email/phone');
        }
      }
    } else {
      // No existing customer - create one
      await ensureCustomerRecord({ name, email, phone });
    }
    
    return { success: true, data };
  } catch (e) {
    logger.error('upgradeAnonymousAccount error', e);
    return { success: false, error: e.message };
  }
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
    logger.error('Sign in error:', error);
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
    logger.debug('✅ Session created immediately - creating Customer record (client)...');
  // Do not persist phone-alias emails into Customer; keep email null unless real
  const customerResult = await ensureCustomerRecord({ name, phone });
    if (!customerResult?.success) {
      logger.error('❌ Failed to create Customer record after signup', customerResult?.error);
    } else {
      logger.debug('✅ Customer record created:', customerResult.data);
    }
  } else {
    logger.debug('⏳ No session - email confirmation required');
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
    logger.error('Phone sign in error:', error);
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
    logger.error('Sign out error:', error);
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
    logger.error('Get user error:', error);
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
    logger.error('Get session error:', error);
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

    // 1. Resolve existing Customer by user_id
    const { data: existingByUser } = await supa
      .from('Customer')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingByUser) {
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: true, data: existingByUser, error: null };
    }

    // 2. Check if phone/email already exists (claimed or unclaimed)
    const rawPhone = overrides.phone || user.user_metadata?.phone || null;
    const phoneNorm = normalizePhone(rawPhone);
    const emailCandidate = overrides.email || user.email || null;

    logger.debug('🔍 Looking for existing Customer to claim or detect conflict:', { phoneNorm, emailCandidate });

    // CRITICAL: For anonymous users, check if email exists in auth.users first!
    if (emailCandidate && user.user_metadata?.anonymous) {
      try {
        const { data: isAvailable, error: checkErr } = await supa.rpc('check_email_available', { 
          email_to_check: emailCandidate 
        });
        
        if (!checkErr && isAvailable === false) {
          logger.warn('❌ Email already registered in auth system');
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { 
            success: false, 
            data: null, 
            error: 'EMAIL_REGISTERED',
            message: 'This email is already registered. Please sign in to continue.'
          };
        }
        
        logger.debug('✅ Email available in auth system');
      } catch (e) {
        // RPC might not exist yet, log but continue
        logger.debug('ℹ️ Could not check email availability:', e.message);
      }
    }

    // Check email first (if provided)
    let existingByEmail = null;
    const isAnonymous = user.user_metadata?.anonymous === true;
    
    if (emailCandidate) {
      const { data: emailMatch, error: emailErr } = await supa
        .from('Customer')
        .select('*')
        .eq('email', emailCandidate)
        .maybeSingle();
      if (emailErr) logger.error('❌ Email lookup failed:', emailErr);
      if (emailMatch) {
        existingByEmail = emailMatch;
        // If belongs to different user AND we're anonymous, this is a conflict - need to sign in instead
        if (emailMatch.user_id && emailMatch.user_id !== user.id) {
          if (isAnonymous) {
            logger.warn('⚠️ Anonymous user trying to use email from existing account - need to sign in');
            if (typeof window !== 'undefined') window.__ensuringCustomer = false;
            return { 
              success: false, 
              data: null, 
              error: 'EXISTING_ACCOUNT_SIGNIN_REQUIRED',
              message: 'This email is already registered. Please sign in to link your bookings.',
              existingUserId: emailMatch.user_id
            };
          }
          logger.warn('⚠️ Email already claimed by another user');
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: false, data: null, error: 'ACCOUNT_EXISTS' };
        }
        logger.debug('✅ Found Customer by email:', emailMatch.id, emailMatch.user_id ? '(claimed)' : '(guest)');
      }
    }
    
    // Check phone (if provided and email didn't find a match)
    let existingByPhone = null;
    if (phoneNorm && !existingByEmail) {
      const { data: phoneMatch, error: phoneErr } = await supa
        .from('Customer')
        .select('*')
        .eq('phone_normalized', phoneNorm)
        .maybeSingle();
      if (phoneErr) logger.error('❌ Phone lookup failed:', phoneErr);
      if (phoneMatch) {
        existingByPhone = phoneMatch;
        // If belongs to different user AND we're anonymous, this is a conflict - need to sign in instead
        if (phoneMatch.user_id && phoneMatch.user_id !== user.id) {
          if (isAnonymous) {
            logger.warn('⚠️ Anonymous user trying to use phone from existing account - need to sign in');
            if (typeof window !== 'undefined') window.__ensuringCustomer = false;
            return { 
              success: false, 
              data: null, 
              error: 'EXISTING_ACCOUNT_SIGNIN_REQUIRED',
              message: 'This phone number is already registered. Please sign in to link your bookings.',
              existingUserId: phoneMatch.user_id
            };
          }
          logger.warn('⚠️ Phone already claimed by another user');
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: false, data: null, error: 'ACCOUNT_EXISTS' };
        }
        logger.debug('✅ Found Customer by phone:', phoneMatch.id, phoneMatch.user_id ? '(claimed)' : '(guest)');
      }
    }
    
    const guestMatch = existingByEmail || existingByPhone;
    
    if (!guestMatch) {
      logger.debug('ℹ️ No existing Customer found, will create new record');
    }

    // 2b. If guestMatch exists and already claimed by current user, return it
    if (guestMatch && guestMatch.user_id === user.id) {
      logger.debug('✅ Customer already belongs to current user, reusing:', guestMatch.id);
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: true, data: guestMatch, error: null };
    }

    // 2c. If guestMatch exists and is unclaimed (user_id IS NULL), claim it
    // For permanent accounts only - anonymous users should create new records
    if (guestMatch && !guestMatch.user_id) {
      if (!isAnonymous) {
        // Permanent account - claim the guest record
        logger.debug('🔗 Attempting to claim unclaimed guest customer:', guestMatch.id);
        try {
          // Try RPC first
          const { error: claimErr } = await supa.rpc('claim_guest_customer', {
            p_customer_id: guestMatch.id,
            p_phone: phoneNorm,
            p_email: emailCandidate,
            p_name: overrides.name || user.user_metadata?.name || guestMatch.name || 'Customer'
          });
          if (!claimErr) {
            logger.debug('✅ Guest claimed via RPC');
            const { data: claimed } = await supa
              .from('Customer')
              .select('*')
              .eq('id', guestMatch.id)
              .maybeSingle();
            if (claimed) {
              if (typeof window !== 'undefined') window.__ensuringCustomer = false;
              return { success: true, data: claimed, error: null, claimedGuest: true };
            }
          } else {
            logger.warn('⚠️ RPC claim failed:', claimErr.message);
            // Fallback direct update if RPC failed but RLS allows
            const { data: updated, error: updErr } = await supa
              .from('Customer')
              .update({ user_id: user.id })
              .eq('id', guestMatch.id)
              .select('*')
              .maybeSingle();
            if (!updErr && updated) {
              logger.debug('✅ Guest claimed via direct update');
              if (typeof window !== 'undefined') window.__ensuringCustomer = false;
              return { success: true, data: updated, error: null, claimedGuest: true };
            } else {
              logger.warn('⚠️ Direct update also failed:', updErr?.message);
            }
          }
        } catch (e) {
          logger.warn('⚠️ Guest claim attempt exception:', e?.message || e);
        }
      } else {
        // Anonymous user found existing unclaimed guest record
        // Per Supabase docs: each anonymous session should create its own record
        logger.debug('⚠️ Anonymous user found existing unclaimed guest, will create separate record');
        // Continue to create new record below
      }
    }

    // Build payload
    // Sanitize email: never persist phone-alias like '@phone.local'
  const aliasEmail = (overrides.email || user.email || '').toString();
  const sanitizedEmail = aliasEmail && aliasEmail.endsWith('@phone.local') ? null : (aliasEmail || null);

    const payload = {
      user_id: user.id,
      name: overrides.name || user.user_metadata?.name || 'Customer',
      email: sanitizedEmail,
      phone: overrides.phone || user.user_metadata?.phone || null,
      phone_normalized: phoneNorm || null,
    };
    
    logger.debug('📝 Creating new Customer record:', { ...payload, user_id: payload.user_id?.substring(0, 8) + '...' });

    // Double-check for conflicts before insert (defensive - should already be caught above)
    for (const field of ['email', 'phone']) {
      if (!payload[field]) continue;
      try {
        const { data: conflict } = await supa
          .from('Customer')
          .select('id,user_id')
          .eq(field, payload[field])
          .maybeSingle();
        if (conflict && conflict.user_id !== user.id) {
          logger.error(`⚠️ UNEXPECTED: Conflict detected on ${field} during insert - this should have been caught earlier!`);
          return {
            success: false,
            error: 'ACCOUNT_EXISTS',
            message: `This ${field} is already registered to another account.`,
            code: 'ACCOUNT_EXISTS'
          };
        }
      } catch (err) {
        logger.warn(`Could not check ${field} conflict:`, err);
      }
    }

    // Upsert on user_id
    // 3. Insert new row (avoid including conflicting email/phone if already claimed by someone else)
    let { data: created, error: createErr } = await supa
      .from('Customer')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (createErr && createErr.code === '23505') {
      // Unique violation on email/phone, attempt to reuse existing row for this user (race) or return ACCOUNT_EXISTS
      // Check if conflict belongs to another user
      const conflictEmail = payload.email;
      const conflictPhoneNorm = payload.phone_normalized;
      let ownershipConflict = false;
      
      if (conflictEmail) {
        const { data: emailRow } = await supa.from('Customer').select('*').eq('email', conflictEmail).maybeSingle();
        if (emailRow && emailRow.user_id && emailRow.user_id !== user.id) {
          logger.warn('⚠️ Email conflict: belongs to different user');
          ownershipConflict = true;
        }
        if (emailRow && emailRow.user_id === user.id) {
          logger.debug('✅ Email conflict resolved: belongs to current user');
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: true, data: emailRow, error: null };
        }
      }
      
      if (!ownershipConflict && conflictPhoneNorm) {
        const { data: phoneRow } = await supa.from('Customer').select('*').eq('phone_normalized', conflictPhoneNorm).maybeSingle();
        if (phoneRow && phoneRow.user_id && phoneRow.user_id !== user.id) {
          logger.warn('⚠️ Phone conflict: belongs to different user');
          ownershipConflict = true;
        }
        if (phoneRow && phoneRow.user_id === user.id) {
          logger.debug('✅ Phone conflict resolved: belongs to current user');
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: true, data: phoneRow, error: null };
        }
      }
      
      if (ownershipConflict) {
        logger.warn('⚠️ Account exists with these credentials for a different user');
        if (typeof window !== 'undefined') window.__ensuringCustomer = false;
        return { success: false, data: null, error: 'ACCOUNT_EXISTS' };
      }
      
      // If we get here, conflict might be with a null user_id record (guest record not claimed)
      logger.warn('⚠️ Unique constraint conflict with unclaimed guest record:', { email: conflictEmail, phone: conflictPhoneNorm });
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: false, data: null, error: 'Phone or email already registered. Please use different contact details.' };
    }

    if (createErr && createErr.code !== '23505') {
      logger.error('ensureCustomerRecord: insert error', createErr.message);
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: false, data: null, error: createErr.message };
    }
    if (typeof window !== 'undefined') window.__ensuringCustomer = false;
    return { success: true, data: created, error: null };
  } catch (e) {
    logger.error('ensureCustomerRecord: unexpected error', e);
    if (typeof window !== 'undefined') window.__ensuringCustomer = false;
    return { success: false, data: null, error: e.message };
  }
}
