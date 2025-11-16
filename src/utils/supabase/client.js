
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // Use a distinct storage key so booking-app auth doesn't collide with admin app in the same origin
        storageKey: 'sb-booking-auth',
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
