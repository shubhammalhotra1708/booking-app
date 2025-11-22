-- Migration: Deduplicate Customer phone_normalized & enforce uniqueness
-- Run this AFTER adding phone_normalized column & updating functions.
-- Safe approach: merge duplicates by earliest created row; re-point bookings; delete extras.
-- NOTE: Review output of verification queries before final DELETE.

BEGIN;

-- 1. Cleanup malformed +910... numbers (extra leading zero after country code 91)
UPDATE public."Customer"
SET phone_normalized = regexp_replace(phone_normalized, '^\+910', '+91')
WHERE phone_normalized ~ '^\+910' AND phone_normalized IS NOT NULL;

-- 2. Unify representations missing leading + (defensive)
UPDATE public."Customer"
SET phone_normalized = '+' || regexp_replace(phone_normalized, '^\+?', '')
WHERE phone_normalized IS NOT NULL AND left(phone_normalized, 1) <> '+';

-- 3. Build ranked set for duplicates (by normalized phone)
WITH ranked AS (
  SELECT 
    c.id,
    c.phone_normalized,
    c.user_id,
    c.created_at,
    ROW_NUMBER() OVER (PARTITION BY c.phone_normalized ORDER BY c.created_at ASC) AS rn,
    FIRST_VALUE(c.id) OVER (PARTITION BY c.phone_normalized ORDER BY c.created_at ASC) AS earliest_id
  FROM public."Customer" c
  WHERE c.phone_normalized IS NOT NULL
), updated_bookings AS (
  UPDATE public."Booking" b
  SET customer_id = r.earliest_id
  FROM ranked r
  WHERE b.customer_id = r.id AND r.rn > 1
  RETURNING b.id
)
-- 4. Delete duplicate Customer rows (keep earliest per phone)
DELETE FROM public."Customer" c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- 5. Optional: collapse duplicates where multiple claimed entries exist (should not happen; defensive)
-- If two claimed rows share phone_normalized, keep earliest with user_id, attach bookings.
WITH claimed_dupes AS (
  SELECT phone_normalized, ARRAY_AGG(id ORDER BY created_at ASC) AS ids, COUNT(*) AS ct
  FROM public."Customer"
  WHERE phone_normalized IS NOT NULL AND user_id IS NOT NULL
  GROUP BY phone_normalized HAVING COUNT(*) > 1
)
UPDATE public."Booking" b
SET customer_id = (SELECT ids[1] FROM claimed_dupes cd WHERE cd.phone_normalized = b.customer_phone)
WHERE b.customer_phone IN (SELECT phone_normalized FROM claimed_dupes);

DELETE FROM public."Customer" c
WHERE c.user_id IS NOT NULL AND c.phone_normalized IN (
  SELECT phone_normalized FROM public."Customer"
  WHERE phone_normalized IS NOT NULL AND user_id IS NOT NULL
  GROUP BY phone_normalized HAVING COUNT(*) > 1
) AND c.id NOT IN (
  SELECT ids[1] FROM (
    SELECT phone_normalized, ARRAY_AGG(id ORDER BY created_at ASC) AS ids
    FROM public."Customer"
    WHERE phone_normalized IS NOT NULL AND user_id IS NOT NULL
    GROUP BY phone_normalized
  ) s
);

COMMIT;

-- 6. Verification queries (run manually AFTER commit)
-- SELECT phone_normalized, COUNT(*) FROM public."Customer" GROUP BY phone_normalized HAVING COUNT(*) > 1;
-- SELECT COUNT(*) FROM public."Customer" WHERE phone_normalized ~ '^\+910';
-- SELECT COUNT(*) FROM public."Customer" WHERE phone_normalized IS NULL;

-- 7. Create unique index (run ONLY when duplicates resolved)
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS customer_phone_normalized_unique ON public."Customer"(phone_normalized);
