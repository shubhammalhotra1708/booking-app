import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';

// POST /api/auth/stamp-role - set app_metadata.role='customer' for current authenticated user
export async function POST() {
  try {
    const supa = await createClient();
    const { data: { user }, error: authError } = await supa.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    }

    const service = createServiceClient();

    // If already stamped, no-op
    if (user.app_metadata?.role === 'customer') {
      return NextResponse.json({ success: true, updated: false });
    }

    const { data, error } = await service.auth.admin.updateUserById(user.id, {
      app_metadata: { ...(user.app_metadata || {}), role: 'customer' },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
