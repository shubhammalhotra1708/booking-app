import { logger } from '@/lib/logger';
import { createClient } from "@/utils/supabase/server";

// DEBUG ENDPOINT: Public API Testing  
// Purpose: Test APIs with anon key (respects RLS policies)
// Usage: http://localhost:3000/api/debug
// Security: Uses public anon key, shows what customers see

export async function GET() {
  // Disable debug endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 404 });
  }
  
  try {
    const supabase = await createClient();
    
    // Check authentication status (should be null for public access)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Test all tables
    const results = {
      auth: { user: user ? { id: user.id, email: user.email } : null, error: authError }
    };
    
    // Test Shop table with public policy conditions
    const { data: shops, error: shopError } = await supabase
      .from('Shop')
      .select('*')
      .limit(10);
    results.shops = { data: shops, error: shopError };
    
    // Also test all shops (should show same as above due to RLS)
    const { data: allShops, error: allShopsError } = await supabase
      .from('Shop')
      .select('id, name, is_active, is_verified')
      .limit(20);
    results.allShops = { data: allShops, error: allShopsError };
    
    // Test Service table  
    const { data: services, error: serviceError } = await supabase
      .from('Service')
      .select('*')
      .limit(3);
    results.services = { data: services, error: serviceError };
    
    // Test Staff table with minimal columns first
    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('id, created_at, name, gender, about')
      .limit(10);
    results.staff = { data: staff, error: staffError };
    
    // Test with all columns to see what exists
    const { data: staffAllCols, error: staffAllColsError } = await supabase
      .from('Staff')
      .select('*')
      .limit(3);
    results.staffAllColumns = { data: staffAllCols, error: staffAllColsError };
    
    // Test with count to see total records (bypasses some RLS)
    const { count: staffCountTotal, error: staffCountTotalError } = await supabase
      .from('Staff')
      .select('*', { count: 'exact', head: true });
    results.staffCountTotal = { count: staffCountTotal, error: staffCountTotalError };
    
    // Also test with different column selections
    const { data: staffAll, error: staffAllError } = await supabase
      .from('Staff')
      .select('*')
      .limit(5);
    results.staffAll = { data: staffAll, error: staffAllError };
    
    // Already have staff count above
    
    // Test Booking table
    const { data: bookings, error: bookingError } = await supabase
      .from('Booking')
      .select('*')
      .limit(3);
    results.bookings = { data: bookings, error: bookingError };
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database debug information',
        results 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    logger.error("Debug API error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}