-- Verify table exists and check current policies
-- Run this first to see what's wrong

-- Check if table exists with quotes or without
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name = 'Customer' OR table_name = '"Customer"');

-- Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename ILIKE '%customer%';

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename ILIKE '%customer%';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name ILIKE '%customer%'
ORDER BY ordinal_position;
