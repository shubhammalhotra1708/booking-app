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

// Attempt to find existing customer by email (unique) or phone.
// Returns null if not found or if RLS blocks access.
export async function findExistingCustomer(supabase, { email, phone }) {
  try {
    if (email) {
      const { data, error } = await supabase
        .from('Customer')
        .select('id, user_id, email, phone')
        .eq('email', email)
        .maybeSingle();
      if (!error && data) return data;
    }
    if (phone) {
      // Try phone_normalized first (new column), fallback to legacy phone field
      const { data: byNormalized, error: normErr } = await supabase
        .from('Customer')
        .select('id, user_id, email, phone, phone_normalized')
        .eq('phone_normalized', phone)
        .limit(1);
      if (!normErr && byNormalized && byNormalized.length) return byNormalized[0];
      const { data, error } = await supabase
        .from('Customer')
        .select('id, user_id, email, phone, phone_normalized')
        .eq('phone', phone)
        .limit(1);
      if (!error && data && data.length) return data[0];
    }
    return null;
  } catch (_) {
    return null; // swallow RLS errors for guest flow
  }
}
