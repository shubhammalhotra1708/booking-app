-- Migration: Add phone_normalized column for Customer
-- Date: 2025-11-22
-- 1. Add column
ALTER TABLE public."Customer" ADD COLUMN IF NOT EXISTS phone_normalized text;

-- 2. Backfill normalization (simple heuristic: strip non-digits, if 10 digits prepend 91, ensure leading +)
-- Backfill normalized phone values (robust version fixing scope of digits)
UPDATE public."Customer" c
SET phone_normalized = CASE
    WHEN d.digits IS NULL OR length(d.digits) = 0 THEN NULL
    WHEN length(d.digits) = 10 THEN '+91' || d.digits                          -- local 10-digit
    WHEN left(d.digits,2) = '91' AND length(d.digits) = 12 THEN '+' || d.digits -- already includes country code 91
    WHEN left(d.digits,3) = '+91' THEN d.digits                                 -- already normalized with plus
    WHEN left(d.digits,1) = '+' THEN d.digits                                   -- any other plus-prefixed international
    ELSE '+' || d.digits                                                        -- fallback: just add plus
  END
FROM (
  SELECT id, regexp_replace(phone, '[^0-9]', '', 'g') AS digits
  FROM public."Customer"
) AS d
WHERE c.id = d.id
  AND c.phone IS NOT NULL
  AND c.phone_normalized IS NULL;

-- 3. Merge duplicate guest customers by phone_normalized (choose earliest with user_id if any)
--    NOTE: This creates a temp table of winners and reassigns bookings.
WITH ranked AS (
  SELECT id, phone_normalized, user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY phone_normalized ORDER BY (user_id IS NULL), created_at) AS rn,
         FIRST_VALUE(id) OVER (PARTITION BY phone_normalized ORDER BY (user_id IS NULL), created_at) AS primary_id
  FROM public."Customer"
  WHERE phone_normalized IS NOT NULL
), losers AS (
  SELECT r.* FROM ranked r WHERE r.rn > 1
)
UPDATE public."Booking" b SET customer_id = l.primary_id
FROM losers l
WHERE b.customer_id = l.id;

-- 4. Delete duplicate customer rows that are guests (user_id IS NULL) and not primary
DELETE FROM public."Customer" c USING ranked r
WHERE c.id = r.id AND r.rn > 1 AND c.user_id IS NULL;

-- 5. Enforce uniqueness on phone_normalized for claimed accounts and single guest per number
--    Partial unique index allows multiple NULLs.
CREATE UNIQUE INDEX IF NOT EXISTS customer_phone_normalized_unique ON public."Customer"(phone_normalized);

-- 6. Optional: validate no remaining duplicates
-- SELECT phone_normalized, COUNT(*) FROM public."Customer" GROUP BY phone_normalized HAVING COUNT(*) > 1;




-- =========================================
-- PHASE 1: phone_normalized migration
-- =========================================

-- 1. Add column (idempotent)
ALTER TABLE public."Customer"
  ADD COLUMN IF NOT EXISTS phone_normalized text;

-- 2. Backfill normalization (simple heuristic for Indian numbers)
-- (Removed duplicate backfill block below; previous section performs the normalization.)

-- 3. Merge duplicates by phone_normalized
--    Claimed customers (user_id IS NOT NULL) win over guests; earliest created wins.
WITH ranked AS (
  SELECT id,
         phone_normalized,
         user_id,
         created_at,
         ROW_NUMBER() OVER (
           PARTITION BY phone_normalized
           ORDER BY (user_id IS NULL), created_at
         ) AS rn,
         FIRST_VALUE(id) OVER (
           PARTITION BY phone_normalized
           ORDER BY (user_id IS NULL), created_at
         ) AS primary_id
  FROM public."Customer"
  WHERE phone_normalized IS NOT NULL
),
losers AS (
  SELECT * FROM ranked WHERE rn > 1
)
-- Reassign bookings pointing at duplicate (loser) customer rows
UPDATE public."Booking" b
SET customer_id = l.primary_id
FROM losers l
WHERE b.customer_id = l.id;

-- 4. Delete guest duplicate rows (keep primaries)
DELETE FROM public."Customer" c
USING ranked r
WHERE c.id = r.id
  AND r.rn > 1
  AND c.user_id IS NULL;

-- 5. Create unique index (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS customer_phone_normalized_unique
  ON public."Customer"(phone_normalized);

-- =========================================
-- PHASE 2: create_guest_customer function
-- =========================================

CREATE OR REPLACE FUNCTION public.create_guest_customer(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL
) RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  phone_normalized text,
  email text,
  created boolean
) AS $$
DECLARE
  v_existing_claimed uuid;
  v_existing_guest uuid;
  v_phone_normalized text;
BEGIN
  IF p_phone IS NULL AND p_email IS NULL THEN
    RAISE EXCEPTION 'At least one of phone or email required' USING ERRCODE = '22000';
  END IF;

  -- Normalize phone internally (strip, prepend 91 if 10 digits)
  IF p_phone IS NOT NULL THEN
    p_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(p_phone) = 10 THEN
      p_phone := '91' || p_phone;
    END IF;
    v_phone_normalized := '+' || p_phone;
  END IF;

  -- Conflict if claimed customer already exists for email or phone_normalized
  SELECT c.id INTO v_existing_claimed
  FROM public."Customer" c
  WHERE (p_email IS NOT NULL AND c.email = p_email AND c.user_id IS NOT NULL)
     OR (v_phone_normalized IS NOT NULL AND c.phone_normalized = v_phone_normalized AND c.user_id IS NOT NULL)
  LIMIT 1;

  IF v_existing_claimed IS NOT NULL THEN
    RAISE EXCEPTION 'ACCOUNT_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  -- Reuse existing guest if present
  SELECT c.id INTO v_existing_guest
  FROM public."Customer" c
  WHERE (p_email IS NOT NULL AND c.email = p_email AND c.user_id IS NULL)
     OR (v_phone_normalized IS NOT NULL AND c.phone_normalized = v_phone_normalized AND c.user_id IS NULL)
  ORDER BY c.created_at ASC
  LIMIT 1;

  IF v_existing_guest IS NOT NULL THEN
    RETURN QUERY
    SELECT c.id, c.name, c.phone, c.phone_normalized, c.email, false
    FROM public."Customer" c
    WHERE c.id = v_existing_guest;
    RETURN;
  END IF;

  -- Insert new guest row
  INSERT INTO public."Customer"(name, phone, phone_normalized, email, user_id)
  VALUES (p_name, p_phone, v_phone_normalized, p_email, NULL)
  RETURNING id, name, phone, phone_normalized, email
  INTO v_existing_guest, p_name, p_phone, v_phone_normalized, p_email;

  RETURN QUERY SELECT v_existing_guest, p_name, p_phone, v_phone_normalized, p_email, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_guest_customer(text, text, text) TO anon, authenticated;

-- =========================================
-- PHASE 3: claim_guest_customer function
-- =========================================

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
  v_phone_normalized text;
  v_email text;
  v_name text;
  v_updates integer := 0;
  v_existing_claimed uuid;
BEGIN
  v_auth := auth.uid();
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  IF p_phone IS NOT NULL THEN
    v_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_phone) = 10 THEN
      v_phone := '91' || v_phone;
    END IF;
    v_phone_normalized := '+' || v_phone;
  END IF;

  v_email := p_email;
  v_name := p_name;

  -- Locate target customer
  IF p_customer_id IS NOT NULL THEN
    SELECT id, phone, phone_normalized, email, name, user_id
      INTO v_customer_id, v_phone, v_phone_normalized, v_email, v_name, v_existing_claimed
    FROM public."Customer"
    WHERE id = p_customer_id
    LIMIT 1;
    IF v_customer_id IS NULL THEN
      RAISE EXCEPTION 'CLAIM_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
    IF v_existing_claimed IS NOT NULL AND v_existing_claimed <> v_auth THEN
      RAISE EXCEPTION 'ACCOUNT_EXISTS' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    SELECT c.id, c.phone, c.phone_normalized, c.email, c.name, c.user_id
      INTO v_customer_id, v_phone, v_phone_normalized, v_email, v_name, v_existing_claimed
    FROM public."Customer" c
    WHERE (v_phone_normalized IS NOT NULL AND c.phone_normalized = v_phone_normalized)
       OR (v_email IS NOT NULL AND c.email = v_email)
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

  -- Attach user and update meta
  UPDATE public."Customer"
    SET user_id = COALESCE(user_id, v_auth),
        name = COALESCE(v_name, name),
        email = COALESCE(v_email, email),
        phone = COALESCE(v_phone, phone),
        phone_normalized = COALESCE(v_phone_normalized, phone_normalized)
  WHERE id = v_customer_id;

  -- Backfill inline guest bookings
  UPDATE public."Booking"
    SET customer_id = v_customer_id
  WHERE customer_id IS NULL
    AND (
      (v_phone_normalized IS NOT NULL AND customer_phone = v_phone_normalized)
      OR (v_email IS NOT NULL AND customer_email = v_email)
    );
  GET DIAGNOSTICS v_updates = ROW_COUNT;

  RETURN QUERY SELECT v_customer_id, v_updates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.claim_guest_customer(uuid, text, text, text) TO authenticated;

-- =========================================
-- OPTIONAL VERIFICATION QUERIES
-- (Run after everything above succeeds)
-- =========================================

-- Check unique index exists
-- SELECT indexname FROM pg_indexes WHERE tablename = 'Customer' AND indexname = 'customer_phone_normalized_unique';

-- Spot-check normalization
-- SELECT id, phone, phone_normalized, user_id FROM public."Customer" ORDER BY created_at DESC LIMIT 10;

-- Duplicate audit (should return zero rows)
-- SELECT phone_normalized, COUNT(*) FROM public."Customer"
-- GROUP BY phone_normalized HAVING COUNT(*) > 1;

-- Guest creation smoke test
-- SELECT * FROM public.create_guest_customer('Guest Test','9876543210', NULL);

-- Claim test (after creating guest & signing in with an auth user)
-- SELECT * FROM public.claim_guest_customer(NULL,'9876543210', NULL, 'Claimed Test');
