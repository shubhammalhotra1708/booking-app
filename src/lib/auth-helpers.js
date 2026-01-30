'use client';

import { createClient } from '@/utils/supabase/client';
import { normalizePhone } from '@/lib/identity';
import { logger } from '@/lib/logger';

/**
 * Client-side auth helpers for Supabase
 * These are used in client components like forms
 * 
 * IDENTITY MODEL:
 * - Email = Unique identifier (enforced by Supabase auth.users)
 * - Phone = Contact metadata (NOT unique, can be shared by multiple users)
 * - user_id = Supabase auth.users.id (primary key for Customer records)
 * 
 * Design Rationale:
 * - Email OTP is the only authentication method (SMS OTP not yet implemented)
 * - Phone is stored for booking notifications, not authentication
 * - Multiple users can share the same phone (family/business scenarios)
 * - Phone/name are updated on each login to keep contact info current
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

  // Check if email or phone already exists
  const existingCheck = await checkExistingCustomer({ email, phone });
  if (existingCheck.exists) {
    return {
      success: false,
      error: existingCheck.message,
      code: existingCheck.conflict === 'email' ? 'EMAIL_EXISTS' : 'PHONE_EXISTS'
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
 * Check if email already exists in Customer table
 * 
 * NOTE: Phone is NOT checked for duplicates - it's contact info only.
 * Multiple users can share the same phone number (family/business use case).
 * Email is the sole unique identifier via Supabase auth.users.
 */
export async function checkExistingCustomer({ email, phone }) {
  try {
    const supa = createClient();

    // Check email only - this is the unique identifier
    if (email) {
      const { data: emailMatch, error: emailErr } = await supa
        .from('Customer')
        .select('id, email, phone, user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (emailErr) {
        logger.error('Error checking email:', emailErr);
      }
      
      if (emailMatch) {
        return {
          exists: true,
          conflict: 'email',
          message: 'This email is already registered. Please sign in instead.',
          data: emailMatch
        };
      }
    }

    // Phone is NOT checked - allowing duplicate phones for shared family/business numbers
    // Phone is stored as contact metadata, not an authentication identifier

    return { exists: false };
  } catch (e) {
    logger.error('checkExistingCustomer error:', e);
    return { exists: false, error: e.message };
  }
}

/**
 * Send OTP for passwordless authentication
 * Supports both email and phone verification
 * For anonymous users: links OTP identity to existing session
 * For new users: creates account without password
 */
export async function sendOTP({ email, phone, name }) {
  try {
    const supa = createClient();
    const { data: { user: currentUser } } = await supa.auth.getUser();
    const isAnonymous = currentUser && currentUser.user_metadata?.anonymous === true;

    // Determine which method to use
    const method = email ? 'email' : phone ? 'sms' : null;
    if (!method) {
      return { success: false, error: 'Email or phone is required' };
    }

    // For new users (not logged in), check if email/phone already exists
    if (!currentUser || isAnonymous) {
      const existingCheck = await checkExistingCustomer({ email, phone });

      if (existingCheck.exists) {
        return {
          success: false,
          error: existingCheck.message,
          code: existingCheck.conflict === 'email' ? 'EMAIL_EXISTS' : 'PHONE_EXISTS',
          conflict: existingCheck.conflict
        };
      }
    }

    // For anonymous users, use linkIdentity to upgrade session
    // For new/existing users, use signInWithOtp
    const options = {
      shouldCreateUser: !isAnonymous, // Only create new user if not anonymous
      data: {
        name: name || 'Customer',
        phone: phone || undefined,
        verified_via: 'otp',
        temp_account: false,
        anonymous: false
      }
    };

    if (isAnonymous) {
      // Anonymous user - link OTP identity to existing session
      logger.debug('🔗 Linking OTP identity to anonymous session');
      options.shouldCreateUser = false;
    }

    const otpParams = email
      ? { email, options }
      : { phone, options };

    const { data, error } = await supa.auth.signInWithOtp(otpParams);

    if (error) {
      logger.error('❌ sendOTP error:', error);
      if (error.message?.includes('already registered') || error.status === 422) {
        return {
          success: false,
          error: 'This email/phone is already registered. Please sign in instead.',
          code: 'already_registered'
        };
      }
      return { success: false, error: error.message };
    }

    logger.debug('✅ OTP sent successfully');
    return { success: true, data };
  } catch (e) {
    logger.error('sendOTP exception:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Verify OTP code
 * Automatically links to anonymous session if applicable
 *
 * @param {Object} params
 * @param {string} [params.email] - Email for verification
 * @param {string} [params.phone] - Phone for verification AND customer record
 * @param {string} [params.name] - Name from form for customer record
 * @param {string} params.token - OTP code
 */
export async function verifyOTP({ email, phone, name, token }) {
  try {
    const supa = createClient();

    const verifyParams = email
      ? { email, token, type: 'email' }
      : { phone, token, type: 'sms' };

    const { data, error } = await supa.auth.verifyOtp(verifyParams);

    if (error) {
      logger.error('❌ verifyOTP error:', error);
      return {
        success: false,
        error: error.message === 'Token has expired or is invalid'
          ? 'Invalid or expired code. Please request a new one.'
          : 'Verification failed. Please try again.'
      };
    }

    // After successful verification, ensure Customer record exists
    if (data.user) {
      logger.debug('✅ OTP verified, ensuring Customer record');
      // Use phone/name from function parameters (form data) since user_metadata
      // may not be updated for existing users (e.g., salon owner booking as customer)
      const customerPhone = phone || data.user.phone || data.user.user_metadata?.phone;
      const customerName = name || data.user.user_metadata?.name || 'Customer';

      const customerResult = await ensureCustomerRecord({
        email: data.user.email,
        phone: customerPhone,
        name: customerName
      });
      
      // Handle Customer record creation/linking
      if (!customerResult.success) {
        // ACCOUNT_EXISTS means user already has a Customer record - that's OK for sign-in
        if (customerResult.error === 'ACCOUNT_EXISTS') {
          logger.debug('✅ Customer account already exists (sign-in via OTP)');
        } else {
          // Real error - log and return failure
          logger.error('❌ Failed to create/update Customer after OTP verification:', customerResult.error);
          return { 
            success: false, 
            error: customerResult.error || 'CUSTOMER_RECORD_FAILED',
            message: customerResult.message || 'Failed to create customer record'
          };
        }
      } else {
        logger.debug('✅ Customer record ensured:', customerResult.data?.id);
      }

      // Stamp role=customer
      try {
        await fetch('/api/auth/stamp-role', { method: 'POST' });
      } catch (e) {
        logger.warn('Could not stamp customer role (non-fatal):', e?.message || e);
      }
    }

    return { success: true, data, user: data.user };
  } catch (e) {
    logger.error('verifyOTP exception:', e);
    return { success: false, error: e.message };
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

    // Get phone and email data FIRST before any lookups
    const rawPhone = overrides.phone || user.user_metadata?.phone || null;
    const phoneNorm = normalizePhone(rawPhone);
    const emailCandidate = overrides.email || user.email || null;

    // 1. Resolve existing Customer by user_id
    const { data: existingByUser } = await supa
      .from('Customer')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingByUser) {
      // Update phone/name on each login to keep contact info current
      const shouldUpdate = 
        (rawPhone && rawPhone !== existingByUser.phone) ||
        (overrides.name && overrides.name !== existingByUser.name);
      
      if (shouldUpdate) {
        logger.debug('📱 Updating customer contact info:', { 
          id: existingByUser.id,
          oldPhone: existingByUser.phone,
          newPhone: rawPhone,
          oldName: existingByUser.name,
          newName: overrides.name
        });
        
        const updatePayload = {
            phone: rawPhone || existingByUser.phone,
            phone_normalized: phoneNorm || existingByUser.phone_normalized,
            name: overrides.name || existingByUser.name
          };
        // Only update birthday if provided and not already set
        if (overrides.birthday && !existingByUser.birthday) {
          updatePayload.birthday = overrides.birthday;
        }
        const { data: updated, error: updateErr } = await supa
          .from('Customer')
          .update(updatePayload)
          .eq('id', existingByUser.id)
          .select('*')
          .maybeSingle();
        
        if (updated) {
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: true, data: updated, error: null, updated: true };
        } else {
          logger.warn('⚠️ Failed to update contact info:', updateErr);
        }
      }
      
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: true, data: existingByUser, error: null };
    }

    // 2. Check if phone/email already exists (claimed or unclaimed)
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
    
    // Phone lookup removed - phone is NOT unique identifier
    // Multiple users can have same phone (shared family/business numbers)
    // Email via Supabase auth is the sole unique identifier
    
    const guestMatch = existingByEmail;
    
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
      birthday: overrides.birthday || null,
    };
    
    logger.debug('📝 Creating new Customer record:', { ...payload, user_id: payload.user_id?.substring(0, 8) + '...' });

    // Double-check for email conflicts before insert (defensive - should already be caught above)
    // NOTE: Only check email - phone is NOT unique and can be shared by multiple customers
    if (payload.email) {
      try {
        const { data: conflict } = await supa
          .from('Customer')
          .select('id,user_id')
          .eq('email', payload.email)
          .maybeSingle();
        if (conflict && conflict.user_id !== user.id) {
          logger.error('⚠️ UNEXPECTED: Email conflict detected during insert - this should have been caught earlier!');
          return {
            success: false,
            error: 'ACCOUNT_EXISTS',
            message: 'This email is already registered to another account.',
            code: 'ACCOUNT_EXISTS'
          };
        }
      } catch (err) {
        logger.warn('Could not check email conflict:', err);
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
      // Unique violation on email (phone is NOT unique, so only email can cause this)
      // Attempt to reuse existing row for this user (race condition) or return ACCOUNT_EXISTS
      const conflictEmail = payload.email;

      if (conflictEmail) {
        const { data: emailRow } = await supa.from('Customer').select('*').eq('email', conflictEmail).maybeSingle();
        if (emailRow && emailRow.user_id && emailRow.user_id !== user.id) {
          logger.warn('⚠️ Email conflict: belongs to different user');
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: false, data: null, error: 'ACCOUNT_EXISTS' };
        }
        if (emailRow && emailRow.user_id === user.id) {
          logger.debug('✅ Email conflict resolved: belongs to current user');
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: true, data: emailRow, error: null };
        }
        // Email exists but user_id is NULL (guest record) - should have been claimed above
        if (emailRow && !emailRow.user_id) {
          logger.warn('⚠️ Unique constraint conflict with unclaimed guest record:', { email: conflictEmail });
          if (typeof window !== 'undefined') window.__ensuringCustomer = false;
          return { success: false, data: null, error: 'Email already registered. Please sign in to claim your account.' };
        }
      }

      // Unknown unique constraint violation
      logger.warn('⚠️ Unknown unique constraint violation');
      if (typeof window !== 'undefined') window.__ensuringCustomer = false;
      return { success: false, data: null, error: 'Email already registered. Please use a different email.' };
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
