-- RLS Verification Script for BookEz (booking-app)
-- Run in Supabase SQL editor as service role or with bypass RLS (for verification only).
-- These queries confirm that anon/auth users cannot read sensitive tables, and can only read what we intend.

-- 1) Public readable views/tables (expected: OK with anon)
-- Replace <SHOP_ID> with a real UUID
\echo '1) Availability RPC works for anon/auth'
select * from get_shop_bookings('<SHOP_ID>', current_date) limit 5;

-- 2) Sensitive tables (expected: PERMISSION DENIED for anon/auth)
\echo '2) Sensitive tables are protected (expect: permission denied)'
-- The following should fail for anon/auth if RLS is on and policies are correct
select * from auth.users limit 1; -- expect fail
select * from "User" limit 1; -- expect fail if exists
select * from "Customer" limit 1; -- expect fail
select * from "Staff" limit 1; -- expect fail
select * from "Owner" limit 1; -- expect fail if exists

-- 3) Booking visibility (expected: user sees only their own via email/phone/customer_id)
\echo '3) Booking visibility policy test (auth required)'
-- Create a test user session then run:
-- set local role authenticated;
-- set request.jwt.claims to '{"sub":"<USER_UUID>","email":"<USER_EMAIL>"}';
-- Replace filters accordingly
select id, shop_id, booking_time, status
from "Booking"
where customer_email = '<USER_EMAIL>' or customer_phone = '<USER_PHONE>'
limit 10;

-- 4) Booking insert via RPC (atomic create) (expected: OK for auth)
\echo '4) Booking creation via RPC (expect: OK)'
-- Replace parameters. This should be run as an authenticated user
-- select * from create_booking_atomic(
--   p_shop_id => '<SHOP_ID>',
--   p_staff_id => '<STAFF_ID>',
--   p_service_id => '<SERVICE_ID>',
--   p_customer_name => 'Test User',
--   p_customer_email => null,
--   p_customer_phone => '<PHONE>',
--   p_booking_time => now() + interval '1 day',
--   p_duration_minutes => 60
-- );

-- 5) Ensure no cross-service leakage of busy state requires table reads
\echo '5) Busy map data shape (via RPC only)'
-- Should return only minimal fields, not leaking PII
select staff_id, booking_time, service_duration, status from get_shop_bookings('<SHOP_ID>', current_date) limit 5;

-- 6) Realtime permissions sanity (optional)
\echo '6) Realtime channels: ensure broadcasts are limited to shop or server-side only'
-- In the Supabase dashboard, check Realtime policies/channels for Booking changes scoped to shop_id if used.

-- Notes:
-- - Use SECURITY DEFINER for get_shop_bookings and grant execute to anon, auth.
-- - Do NOT grant select on sensitive tables (Customer, Staff, Owner).
-- - Booking table RLS must restrict row access to a user's own email/phone/customer_id.
