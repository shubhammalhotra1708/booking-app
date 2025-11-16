-- Fix RLS policies for Customer table
-- Run this in Supabase SQL Editor

-- First, drop all existing policies on Customer table
DROP POLICY IF EXISTS "Users can read own customer data" ON public."Customer";
DROP POLICY IF EXISTS "Users can update own customer data" ON public."Customer";
DROP POLICY IF EXISTS "Anyone can create customer records" ON public."Customer";

-- Recreate policies with correct permissions

-- 1. Allow INSERT for authenticated users (signup)
CREATE POLICY "Enable insert for authenticated users"
  ON public."Customer"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Allow SELECT for users to read their own data
CREATE POLICY "Enable select for users based on user_id"
  ON public."Customer"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Allow UPDATE for users to update their own data
CREATE POLICY "Enable update for users based on user_id"
  ON public."Customer"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'Customer';
