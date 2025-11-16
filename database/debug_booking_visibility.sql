-- Debug kit: verify why bookings don't appear in My Bookings
-- Paste and run in Supabase SQL editor. Replace values in <> where noted.

-- 1) Identify your auth user by email
-- Replace with your login email
SELECT id AS auth_user_id, email
FROM auth.users
WHERE email = 'shubhammalhotracr3@gmail.com';

-- 2) Find your Customer row by user_id (paste auth_user_id)
SELECT id AS customer_id, user_id, name, email, phone, created_at
FROM public."Customer"
WHERE user_id = '4960e6d1-2225-47a0-b133-373c6db63147'::uuid;

-- 3) Inspect a specific booking by id (highlight param)
SELECT id, customer_id, customer_name, customer_email, customer_phone,
       booking_date, booking_time, status, shop_id, service_id
FROM public."Booking"
WHERE id = 54;

-- 4) List bookings for your customer (paste customer_id from step 2)
SELECT id, booking_date, booking_time, status, customer_id, created_at
FROM public."Booking"
WHERE customer_id = '49938b7a-28c9-414c-a897-72fda61d863b'::uuid
ORDER BY booking_date DESC, booking_time DESC;

-- 5) Check RLS policies present on Booking & Customer
SELECT polname AS policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='Booking'
ORDER BY policyname;

SELECT polname AS policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='Customer'
ORDER BY policyname;

-- 6) Create minimal policies if they are missing (RUN ONLY ONCE)
-- Enable RLS (no-op if already enabled)
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;

-- Allow customers to read their own bookings
CREATE POLICY IF NOT EXISTS booking_select_own
ON public."Booking"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public."Customer" c
    WHERE c.id = "Booking".customer_id
      AND c.user_id = auth.uid()
  )
);

-- Allow customers to insert their own bookings (optional for future client inserts)
CREATE POLICY IF NOT EXISTS booking_insert_own
ON public."Booking"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Customer" c
    WHERE c.id = "Booking".customer_id
      AND c.user_id = auth.uid()
  )
);

-- Basic Customer policies
CREATE POLICY IF NOT EXISTS customer_select_self
ON public."Customer"
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS customer_insert_self
ON public."Customer"
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 7) Duplicate checks (sanity)
SELECT email, COUNT(*)
FROM public."Customer"
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, email;

SELECT phone, COUNT(*)
FROM public."Customer"
WHERE phone IS NOT NULL
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, phone;

-- 8) Optional backfill (only for test data):
-- If a booking was created with NULL customer_id before the fix, set it manually.
-- Replace values accordingly and run once.
-- UPDATE public."Booking"
-- SET customer_id = '49938b7a-28c9-414c-a897-72fda61d863b'::uuid
-- WHERE id = 54;
