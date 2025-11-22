-- SECURITY DEFINER function to create a guest Customer row (no user_id)
-- Preconditions:
--  - Called by anon or authenticated role via Supabase
--  - RLS on Customer only allows authenticated inserts; anon cannot insert directly
-- Purpose:
--  - Allow creation of a Customer row for unauthenticated guest booking so future claim can attach user_id
--  - Prevent duplicates by email or phone (exact match)
-- Safety:
--  - Function validates that no existing claimed customer (user_id IS NOT NULL) shares phone/email
--  - Returns existing unclaimed guest customer if already present (idempotent)
--  - Executes with owner privileges, bypassing RLS
-- Grants:
--  - GRANT EXECUTE ON FUNCTION public.create_guest_customer TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_guest_customer(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL
) RETURNS TABLE(id uuid, name text, phone text, phone_normalized text, email text, created boolean) AS $$
DECLARE
  v_existing_claimed uuid;
  v_existing_guest uuid;
  v_phone text;             -- raw digits with country code (no plus)
  v_phone_normalized text;  -- '+' prefixed canonical phone
BEGIN
  IF p_phone IS NULL AND p_email IS NULL THEN
    RAISE EXCEPTION 'At least one of phone or email required' USING ERRCODE = '22000';
  END IF;

  -- Normalize phone: strip non-digits, prepend country code 91 if local 10-digit, then add '+' for normalized
  IF p_phone IS NOT NULL THEN
    v_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_phone) = 10 THEN
      v_phone := '91' || v_phone;
    END IF;
    -- If already contains leading plus (unlikely after stripping), guard; else add
    IF left(v_phone, 1) = '+' THEN
      v_phone_normalized := v_phone;
    ELSE
      v_phone_normalized := '+' || v_phone;
    END IF;
  END IF;

  -- Check for claimed customer conflict (same phone/email already claimed)
  SELECT c.id INTO v_existing_claimed
    FROM public."Customer" c
    WHERE (
      (p_email IS NOT NULL AND c.email = p_email AND c.user_id IS NOT NULL)
      OR (v_phone_normalized IS NOT NULL AND c.phone_normalized = v_phone_normalized AND c.user_id IS NOT NULL)
    )
    LIMIT 1;
  IF v_existing_claimed IS NOT NULL THEN
    RAISE EXCEPTION 'ACCOUNT_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  -- Reuse existing earliest guest by same phone/email (idempotent)
  SELECT c.id INTO v_existing_guest
    FROM public."Customer" c
    WHERE (
      (p_email IS NOT NULL AND c.email = p_email AND c.user_id IS NULL)
      OR (v_phone_normalized IS NOT NULL AND c.phone_normalized = v_phone_normalized AND c.user_id IS NULL)
    )
    ORDER BY c.created_at ASC
    LIMIT 1;
  IF v_existing_guest IS NOT NULL THEN
    RETURN QUERY SELECT c.id, c.name, c.phone, c.phone_normalized, c.email, false AS created
      FROM public."Customer" c WHERE c.id = v_existing_guest;
    RETURN;
  END IF;

  -- Insert new guest customer row
  INSERT INTO public."Customer"(name, phone, phone_normalized, email, user_id)
    VALUES (p_name, v_phone, v_phone_normalized, p_email, NULL)
    RETURNING 
      "Customer".id, 
      "Customer".name, 
      "Customer".phone, 
      "Customer".phone_normalized, 
      "Customer".email
    INTO v_existing_guest, p_name, v_phone, v_phone_normalized, p_email;

  RETURN QUERY SELECT v_existing_guest, p_name, v_phone, v_phone_normalized, p_email, true AS created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to anon/auth roles
GRANT EXECUTE ON FUNCTION public.create_guest_customer(text, text, text) TO anon, authenticated;
