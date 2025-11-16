-- Migration: Create Customer table and link to Bookings
-- Date: November 15, 2025
-- Purpose: Separate customer data from booking data, link to auth.users

-- Step 1: Create Customer table
CREATE TABLE IF NOT EXISTS public.Customer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add customer_id to Booking table
ALTER TABLE public.Booking 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.Customer(id) ON DELETE SET NULL;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_user_id ON public.Customer(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_email ON public.Customer(email);
CREATE INDEX IF NOT EXISTS idx_booking_customer_id ON public.Booking(customer_id);

-- Step 4: Migrate existing bookings to Customer table
-- This creates Customer records for existing bookings without user_id (guest bookings)
INSERT INTO public.Customer (name, email, phone, created_at)
SELECT DISTINCT 
  customer_name,
  customer_email,
  customer_phone,
  MIN(created_at) as created_at
FROM public.Booking
WHERE customer_email IS NOT NULL
  AND customer_email NOT IN (SELECT email FROM public.Customer)
GROUP BY customer_name, customer_email, customer_phone
ON CONFLICT (email) DO NOTHING;

-- Step 5: Link existing bookings to Customer records by email
UPDATE public.Booking b
SET customer_id = c.id
FROM public.Customer c
WHERE b.customer_email = c.email
  AND b.customer_id IS NULL;

-- Step 6: Create RLS policies for Customer table
ALTER TABLE public.Customer ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own customer record
CREATE POLICY "Users can read own customer data"
  ON public.Customer
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own customer record
CREATE POLICY "Users can update own customer data"
  ON public.Customer
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Anyone can insert customer records (for signup)
CREATE POLICY "Anyone can create customer records"
  ON public.Customer
  FOR INSERT
  WITH CHECK (true);

-- Step 7: Update Booking RLS policies to work with customer_id
-- Drop existing customer-based policies if they exist
DROP POLICY IF EXISTS "Customers can view their bookings by email" ON public.Booking;
DROP POLICY IF EXISTS "Customers can view their bookings by phone" ON public.Booking;

-- New policy: Customers can view bookings linked to their customer_id
CREATE POLICY "Customers can view their own bookings"
  ON public.Booking
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.Customer WHERE user_id = auth.uid()
    )
    OR customer_email IN (
      SELECT email FROM public.Customer WHERE user_id = auth.uid()
    )
  );

-- Policy: Customers can insert bookings (create new appointments)
CREATE POLICY "Anyone can create bookings"
  ON public.Booking
  FOR INSERT
  WITH CHECK (true);

-- Step 8: Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_updated_at
  BEFORE UPDATE ON public.Customer
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_updated_at();

-- Step 9: Create view for easy booking queries with customer data
CREATE OR REPLACE VIEW public.booking_with_customer AS
SELECT 
  b.*,
  c.name as customer_full_name,
  c.user_id as customer_user_id
FROM public.Booking b
LEFT JOIN public.Customer c ON b.customer_id = c.id;

-- Grant access to view
GRANT SELECT ON public.booking_with_customer TO authenticated;
GRANT SELECT ON public.booking_with_customer TO anon;

COMMENT ON TABLE public.Customer IS 'Customer accounts linked to auth.users for the booking app';
COMMENT ON COLUMN public.Customer.user_id IS 'Links to auth.users.id - NULL for guest bookings';
COMMENT ON COLUMN public.Booking.customer_id IS 'Links to Customer.id - replaces customer_email/phone/name fields';
