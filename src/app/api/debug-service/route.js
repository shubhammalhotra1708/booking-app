import { createServiceClient } from "@/utils/supabase/service";

// DEBUG ENDPOINT: Service Role Database Access
// Purpose: Admin debugging to see actual database contents (bypasses RLS)
// Usage: http://localhost:3000/api/debug-service
// Security: Requires SUPABASE_SERVICE_ROLE_KEY in environment

export async function GET() {
  // Disable debug endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 404 });
  }
  
  try {
    // Use service role to bypass RLS and see all data
    const supabase = createServiceClient();
    
    const results = {};
    
    // Test Staff table with service role (bypasses RLS)
    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('*')
      .limit(10);
    results.staffWithServiceRole = { data: staff, error: staffError };
    
    // Test Shop table with service role
    const { data: shops, error: shopsError } = await supabase
      .from('Shop')
      .select('*')
      .limit(5);
    results.shopsWithServiceRole = { data: shops, error: shopsError };
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Service role debug - bypasses RLS',
        results 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Service debug API error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message,
        hint: "Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local"
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}