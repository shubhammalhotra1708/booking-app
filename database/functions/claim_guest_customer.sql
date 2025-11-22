-- SECURITY DEFINER function to claim an existing guest Customer (attach auth user_id)
-- Preconditions:
--  - Caller must be authenticated (auth.uid() not null)
--  - Guest customer row exists (user_id IS NULL)
-- Purpose:
--  - Attach current user to guest customer via user_id
--  - Backfill Booking.customer_id for inline guest bookings matching phone/email
-- Safety:
--  - Reject if a claimed customer already exists for same phone/email (conflict)
--  - Reject if specified customer is already claimed
--  - Idempotent: re-claiming after success returns existing state & 0 new updates
-- Grants:
--  - GRANT EXECUTE ON FUNCTION public.claim_guest_customer TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_guest_customer(
  p_customer_id uuid DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_name text DEFAULT NULL
) RETURNS TABLE(claimed_customer_id uuid, bookings_updated integer) AS $$
DECLARE
  v_auth uuid;
  v_customer_id uuid;
  v_phone text;
  v_phone_normalized text;  -- normalized +<country><number>
  v_email text;
  v_name text;
  v_updates integer := 0;
  v_existing_claimed uuid;
BEGIN
  v_auth := auth.uid();
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  -- Normalize phone input (same heuristic as guest creation)
  IF p_phone IS NOT NULL THEN
    v_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    -- If 10-digit local Indian mobile, prepend country code 91
    IF length(v_phone) = 10 THEN
      v_phone := '91' || v_phone;
    END IF;
    -- Prepend '+' if not already
    IF v_phone IS NOT NULL THEN
      IF left(v_phone, 1) <> '+' THEN
        v_phone_normalized := '+' || v_phone;
      ELSE
        v_phone_normalized := v_phone; -- already has plus
      END IF;
    END IF;
  END IF;
  v_email := p_email;
  v_name := p_name;

  IF p_customer_id IS NOT NULL THEN
    SELECT id, phone, phone_normalized, email, name, user_id
      INTO v_customer_id, v_phone, v_phone_normalized, v_email, v_name, v_existing_claimed
      FROM public."Customer" WHERE id = p_customer_id LIMIT 1;
    IF v_customer_id IS NULL THEN
      RAISE EXCEPTION 'CLAIM_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
    IF v_existing_claimed IS NOT NULL AND v_existing_claimed <> v_auth THEN
      -- Already claimed by someone else
      RAISE EXCEPTION 'ACCOUNT_EXISTS' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    -- Locate earliest guest customer row by phone/email
    SELECT c.id, c.phone, c.phone_normalized, c.email, c.name, c.user_id
      INTO v_customer_id, v_phone, v_phone_normalized, v_email, v_name, v_existing_claimed
      FROM public."Customer" c
      WHERE (
        (v_phone_normalized IS NOT NULL AND c.phone_normalized = v_phone_normalized)
        OR (v_email IS NOT NULL AND c.email = v_email)
      )
      ORDER BY c.created_at ASC
      LIMIT 1;
    IF v_customer_id IS NULL THEN
      RAISE EXCEPTION 'CLAIM_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
    IF v_existing_claimed IS NOT NULL AND v_existing_claimed <> v_auth THEN
      RAISE EXCEPTION 'ACCOUNT_EXISTS' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Conflict: another claimed customer with same phone/email
  SELECT c.id INTO v_existing_claimed
    FROM public."Customer" c
    WHERE c.id <> v_customer_id
      AND c.user_id IS NOT NULL
      AND (
        (v_phone_normalized IS NOT NULL AND c.phone_normalized = v_phone_normalized)
        OR (v_email IS NOT NULL AND c.email = v_email)
      )
    LIMIT 1;
  IF v_existing_claimed IS NOT NULL THEN
    RAISE EXCEPTION 'CLAIM_CONFLICT' USING ERRCODE = 'P0001';
  END IF;

  -- Attach user if not already & refresh basic fields (idempotent)
  UPDATE public."Customer"
    SET user_id = COALESCE(user_id, v_auth),
        name = COALESCE(v_name, name),
        email = COALESCE(v_email, email),
        phone = COALESCE(v_phone, phone),
        phone_normalized = COALESCE(v_phone_normalized, phone_normalized)
    WHERE id = v_customer_id;

  -- Backfill bookings without a customer_id (inline guest bookings)
  UPDATE public."Booking"
    SET customer_id = v_customer_id
    WHERE customer_id IS NULL AND (
      (v_phone_normalized IS NOT NULL AND customer_phone = v_phone_normalized)
      OR (v_email IS NOT NULL AND customer_email = v_email)
    );
  GET DIAGNOSTICS v_updates = ROW_COUNT;

  RETURN QUERY SELECT v_customer_id, v_updates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.claim_guest_customer(uuid, text, text, text) TO authenticated;
