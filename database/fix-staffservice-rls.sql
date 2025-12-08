-- =====================================================
-- Fix StaffService RLS to Allow Public Read Access
-- =====================================================
-- Problem: StaffService table has policies but RLS is DISABLED
-- Current policies don't allow anonymous (public) access
-- Solution: Add PUBLIC policy for anonymous users, then enable RLS safely

-- IMPORTANT: DO NOT ENABLE RLS YET - Test policies first!
-- Current state: RLS disabled (working), policies exist but not enforced

-- Step 1: Check current RLS status (for reference)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'StaffService';
-- Expected: rowsecurity = false (RLS disabled)

-- Step 2: Add the missing PUBLIC policy for anonymous users
-- This is the critical policy that was missing

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated can view staff services" ON "StaffService";
DROP POLICY IF EXISTS "Allow authenticated read" ON "StaffService";
DROP POLICY IF EXISTS "Public can view staff services" ON "StaffService";
DROP POLICY IF EXISTS "Public staff services for booking" ON "StaffService";
DROP POLICY IF EXISTS "Users can access their shop staff services" ON "StaffService";
DROP POLICY IF EXISTS "Shop owners can manage staff services" ON "StaffService";

-- =====================================================
-- READ POLICIES (Public + Authenticated)
-- =====================================================

-- CRITICAL: Allow anonymous (public/anon) users to view staff-service relationships
-- This is needed for the booking flow where customers select services/staff
-- Without this, anonymous users get permission denied
CREATE POLICY "Public can view staff services"
ON "StaffService"
FOR SELECT
TO anon, public
USING (true);

-- Also allow authenticated users (for logged-in customers and admins)
CREATE POLICY "Authenticated can view staff services"
ON "StaffService"
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- WRITE POLICIES (Shop Owners Only)
-- =====================================================

-- Only shop owners can INSERT staff-service relationships
CREATE POLICY "Shop owners can add staff services"
ON "StaffService"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Staff" s
    JOIN "Shop" sh ON s.shop_id = sh.id
    WHERE s.id = staff_id
      AND sh.owner_id = auth.uid()
  )
);

-- Only shop owners can UPDATE staff-service relationships
CREATE POLICY "Shop owners can update staff services"
ON "StaffService"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Staff" s
    JOIN "Shop" sh ON s.shop_id = sh.id
    WHERE s.id = staff_id
      AND sh.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Staff" s
    JOIN "Shop" sh ON s.shop_id = sh.id
    WHERE s.id = staff_id
      AND sh.owner_id = auth.uid()
  )
);

-- Only shop owners can DELETE staff-service relationships
CREATE POLICY "Shop owners can delete staff services"
ON "StaffService"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Staff" s
    JOIN "Shop" sh ON s.shop_id = sh.id
    WHERE s.id = staff_id
      AND sh.owner_id = auth.uid()
  )
);

-- =====================================================
-- Verify RLS status and policies
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'StaffService'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'StaffService';

-- =====================================================
-- TESTING BEFORE ENABLING RLS
-- =====================================================
-- DO NOT RUN THE COMMAND BELOW YET!
-- Test that policies work correctly first:
--
-- 1. Test as anonymous user (logged out):
--    SELECT * FROM "StaffService" LIMIT 5;
--    Expected: Works (returns data)
--
-- 2. Test as authenticated user:
--    SELECT * FROM "StaffService" LIMIT 5;
--    Expected: Works (returns data)
--
-- 3. Test booking flow end-to-end in booking app
--    Expected: Anonymous users can complete bookings
--
-- If all tests pass, then run:
-- ALTER TABLE "StaffService" ENABLE ROW LEVEL SECURITY;
--
-- Note: Keeping RLS disabled for now maintains current working state
-- =====================================================
