-- SIMPLE READ ACCESS - Remove restrictive conditions
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public shop discovery" ON public."Shop";
DROP POLICY IF EXISTS "Public shop discovery - testing" ON public."Shop";

-- Simple read access to active shops (no verification required)
CREATE POLICY "Public can read active shops" ON public."Shop"
  FOR SELECT USING (is_active = true);

-- Simple read access to services from active shops
DROP POLICY IF EXISTS "Public service browsing" ON public."Service";
DROP POLICY IF EXISTS "Public service browsing - testing" ON public."Service";

CREATE POLICY "Public can read services" ON public."Service"
  FOR SELECT USING (
    shop_id IN (SELECT id FROM public."Shop" WHERE is_active = true)
  );

-- Simple read access to staff from active shops
DROP POLICY IF EXISTS "Public staff for booking" ON public."Staff";
DROP POLICY IF EXISTS "Public staff for booking - testing" ON public."Staff";

CREATE POLICY "Public can read staff" ON public."Staff"
  FOR SELECT USING (
    shop_id IN (SELECT id FROM public."Shop" WHERE is_active = true)
  );

-- Test query: SELECT id, name, is_active, is_verified FROM public."Shop";