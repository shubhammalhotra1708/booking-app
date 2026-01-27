// Identity & normalization utilities
// NOTE: For Indian numbers: if 10 digits and no country code, prepend +91.
// Later: replace with libphonenumber-js for full validation.

export function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return null;
  let core = digits;
  if (digits.length === 10) {
    core = '91' + digits; // Indian default country code
  }
  return '+' + core; // final normalized with plus
}

/**
 * Find existing customer by EMAIL ONLY (primary identifier)
 *
 * IMPORTANT: Phone is NOT used for identity lookup because:
 * - Phone is NOT unique in Customer table
 * - Multiple customers can share the same phone (e.g., family members)
 * - Email is the ONLY unique identifier for customers
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} params - Search parameters
 * @param {string} params.email - Email to search for (required for identity)
 * @param {string} params.phone - Phone (ignored for identity lookup)
 * @returns {Object|null} Customer record or null
 */
export async function findExistingCustomer(supabase, { email, phone }) {
  try {
    // Only search by email - it's the ONLY unique identifier
    // Phone is NOT unique and should NOT be used for identity lookup
    if (email) {
      const { data, error } = await supabase
        .from('Customer')
        .select('id, user_id, email, phone, phone_normalized')
        .eq('email', email)
        .maybeSingle();
      if (!error && data) return data;
    }

    // NOTE: We intentionally do NOT search by phone here
    // Phone is contact info only, not an identifier
    return null;
  } catch (_) {
    return null; // swallow RLS errors for guest flow
  }
}
