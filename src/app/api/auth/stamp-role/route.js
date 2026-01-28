import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';

// POST /api/auth/stamp-role - adds 'customer' role to app_metadata.roles array
// Supports multi-role users (e.g., someone who is both customer and owner)
// Uses service-role on the server; never exposed to the browser.
export async function POST() {
  try {
    const supa = await createClient();
    const { data: { user }, error: authError } = await supa.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    }

    const service = createServiceClient();

    // Get current roles array or initialize
    const currentRoles = user.app_metadata?.roles || [];

    // If already has customer role, no-op
    if (currentRoles.includes('customer')) {
      return NextResponse.json({ success: true, updated: false, roles: currentRoles });
    }

    // Add customer role to roles array (preserving existing roles like 'owner')
    const newRoles = [...new Set([...currentRoles, 'customer'])];

    // Determine the primary role for backward compatibility
    // Priority: owner > customer (owner takes precedence if user has both)
    const primaryRole = newRoles.includes('owner') ? 'owner' : 'customer';

    const { data, error } = await service.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata || {}),
        role: primaryRole, // Keep for backward compatibility
        roles: newRoles    // New multi-role support
      },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: true, roles: newRoles, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
