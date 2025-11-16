-- SECURITY DEFINER function to return minimal booking data for availability
-- Returns only staff_id, booking_time, and service duration for a shop+date
-- No customer PII, and limited statuses. Safe to call with anon key.

create or replace function public.get_shop_bookings(
  p_shop_id int,
  p_date date
)
returns table (
  staff_id int,
  booking_time time,
  service_duration int,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    b.staff_id,
    b.booking_time,
    coalesce(s.duration, 30) as service_duration,
    b.status
  from public."Booking" b
  join public."Service" s on s.id = b.service_id
  where b.shop_id = p_shop_id
    and b.booking_date = p_date
    and b.status in ('pending','confirmed','CONFIRMED');
$$;

-- Grant execute to anon and authenticated (reads only)
revoke all on function public.get_shop_bookings(int, date) from public;
grant execute on function public.get_shop_bookings(int, date) to anon, authenticated;
