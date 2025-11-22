-- Re-enable StaffService RLS with proper policy for authenticated users
-- This allows both logged and anonymous users to view staff-service mappings

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated can view staff services" ON "StaffService";
DROP POLICY IF EXISTS "Allow authenticated read" ON "StaffService";

-- Create policy allowing all authenticated users (including anonymous) to SELECT
CREATE POLICY "Authenticated can view staff services"
ON "StaffService"
FOR SELECT
TO authenticated
USING (true);

-- Verify policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'StaffService';
