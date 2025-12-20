'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Get customer by user_id (from auth.users)
 */
export async function getCustomerByUserId(userId) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('Customer')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching customer:', error);
    return null;
  }
  
  return data;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('Customer')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching customer by email:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a new customer
 */
export async function createCustomer({ userId, name, email, phone }) {
  const supabase = await createClient();
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
  }
  
  const { data, error } = await supabase
    .from('Customer')
    .insert({
      user_id: userId,
      name,
      email,
      phone
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating customer:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message, data: null };
  }
  
  if (isDev) {
  }
  return { success: true, data };
}

/**
 * Update customer profile
 */
export async function updateCustomer(customerId, updates) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('Customer')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating customer:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/my-bookings');
  return { success: true, data };
}

/**
 * Get customer's bookings
 */
export async function getCustomerBookings(customerId) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('Booking')
    .select(`
      *,
      Service!Booking_service_id_fkey (id, name, price, duration),
      Staff!Booking_staff_id_fkey (id, name, role),
      Shop!Booking_shop_id_fkey (id, name, address, phone)
    `)
    .eq('customer_id', customerId)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });
  
  if (error) {
    console.error('Error fetching customer bookings:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Link existing booking to customer (for guest bookings that get claimed)
 */
export async function linkBookingToCustomer(bookingId, customerId) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('Booking')
    .update({ customer_id: customerId })
    .eq('id', bookingId)
    .select()
    .single();
  
  if (error) {
    console.error('Error linking booking to customer:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/my-bookings');
  return { success: true, data };
}

/**
 * Get or create customer from auth user
 * This is called after login to ensure Customer record exists
 */
export async function getOrCreateCustomer(authUser) {
  if (!authUser) {
    if (process.env.NODE_ENV !== 'production') {
    }
    return null;
  }
  
  if (process.env.NODE_ENV !== 'production') {
  }
  
  // Try to get existing customer
  let customer = await getCustomerByUserId(authUser.id);
  
  if (customer) {
    if (process.env.NODE_ENV !== 'production') {
    }
    return customer;
  }
  
  if (process.env.NODE_ENV !== 'production') {
  }
  
  // Create customer from auth user data
  const result = await createCustomer({
    userId: authUser.id,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Customer',
    email: authUser.email,
    phone: authUser.user_metadata?.phone || authUser.phone || null
  });
  
  if (!result.success) {
    console.error('Failed to create customer:', result.error);
    return null;
  }
  
  return result.data;
}
