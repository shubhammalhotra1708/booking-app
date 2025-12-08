# Safe StaffService RLS Migration Guide

## Current State (from Security Advisor)

✅ **RLS Status**: DISABLED (this is why booking works!)  
✅ **Existing Policies**: 3 policies defined but NOT enforced  
⚠️ **Issue**: Policies don't include anonymous (public) access  

## Why This Is Actually Working

Even though Supabase shows a security warning, the booking flow works because:
- RLS is **disabled** on the table
- When RLS is disabled, policies are defined but **not enforced**
- All users (anonymous and authenticated) can read the table

## The Problem

If you enable RLS without the PUBLIC policy:
❌ Anonymous users will be blocked  
❌ Booking flow will break  
❌ Customers won't be able to see staff-service mappings  

## Safe Migration Steps

### Step 1: Add the PUBLIC Policy (Safe - RLS Still Disabled)

Run this SQL in Supabase SQL Editor:

```sql
-- This adds the missing policy but doesn't enable RLS yet
-- File: /booking-app/database/fix-staffservice-rls.sql
-- (Run the entire file EXCEPT the ALTER TABLE command at the end)
```

**What this does**:
- Drops old policies that don't allow anonymous access
- Creates new policy: "Public can view staff services" for `anon, public` roles
- Creates policy: "Authenticated can view staff services" for logged-in users
- Creates write policies for shop owners (INSERT, UPDATE, DELETE)
- **Does NOT enable RLS** (keeping current working state)

### Step 2: Test the Booking Flow (Critical!)

Before enabling RLS, test thoroughly:

#### Test 1: Anonymous Booking
1. Open booking app in incognito/private window
2. Navigate to `/salon/[id]/book`
3. Select a service
4. Check if staff members load correctly
5. Complete a booking
6. **Expected**: Everything works normally

#### Test 2: Check Database Access
In Supabase SQL Editor (logged out):
```sql
SELECT * FROM "StaffService" LIMIT 5;
```
**Expected**: Returns data (because RLS is still disabled)

#### Test 3: Verify Policies Exist
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'StaffService'
ORDER BY cmd, policyname;
```
**Expected**: Should see policies including "Public can view staff services" with role = {anon, public}

### Step 3: Enable RLS (Only if Step 2 passes)

⚠️ **ONLY RUN THIS AFTER TESTING** ⚠️

```sql
ALTER TABLE "StaffService" ENABLE ROW LEVEL SECURITY;
```

### Step 4: Test Again After Enabling RLS

Repeat all tests from Step 2:
- Anonymous booking flow
- Database access as anonymous user
- Verify no permission errors

### Step 5: Verify Security Advisor is Happy

1. Go to Supabase Security Advisor
2. Refresh the page
3. The "Policy Exists RLS Disabled" warning should be resolved
4. Table should show as properly secured

## Rollback Plan (If Something Breaks)

If enabling RLS breaks the booking flow:

```sql
-- Immediately disable RLS
ALTER TABLE "StaffService" DISABLE ROW LEVEL SECURITY;

-- Check what went wrong
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'StaffService';
```

Then investigate which policy is blocking access.

## What Each Policy Does

### Read Policies (Allow Everyone)
```sql
"Public can view staff services"
- Roles: anon, public
- Action: SELECT
- Rule: USING (true) -- allows all reads
```

```sql
"Authenticated can view staff services"  
- Roles: authenticated
- Action: SELECT
- Rule: USING (true) -- allows all reads
```

### Write Policies (Restrict to Shop Owners)
```sql
"Shop owners can add staff services"
- Roles: authenticated
- Action: INSERT
- Rule: Only if user owns the shop that the staff belongs to
```

```sql
"Shop owners can update staff services"
- Roles: authenticated  
- Action: UPDATE
- Rule: Only if user owns the shop that the staff belongs to
```

```sql
"Shop owners can delete staff services"
- Roles: authenticated
- Action: DELETE
- Rule: Only if user owns the shop that the staff belongs to
```

## Why This Approach is Safe

1. **Policies Added First**: We add policies while RLS is disabled (no risk)
2. **Test Before Enable**: We verify policies work before enforcing them
3. **Easy Rollback**: If something breaks, just disable RLS again
4. **No Data Loss**: Only affects access control, not data
5. **Gradual Migration**: Can test in production without breaking existing flow

## Current vs. New State

### Before (Current - Working)
```
StaffService table:
├── RLS: DISABLED ✅ (this is why it works)
├── Policies: Exist but not enforced
└── Access: Everyone can read/write (open)
```

### After (Goal - Secure)
```
StaffService table:
├── RLS: ENABLED ✅ (enforcing security)
├── Policies: Active and working
│   ├── READ: anon, public, authenticated ✅
│   └── WRITE: shop owners only ✅
└── Access: Controlled by policies
```

## Questions Before Migrating?

- [ ] Have you backed up your database?
- [ ] Is this a low-traffic time (in case rollback needed)?
- [ ] Do you have Supabase SQL Editor access ready?
- [ ] Have you tested booking flow before starting?

## After Migration

1. Monitor error logs for permission denied errors
2. Check booking completion rate (should not drop)
3. Test both anonymous and authenticated bookings
4. Verify Security Advisor shows green checkmark

## Need Help?

If you encounter issues:
1. Check browser console for RLS errors
2. Check Supabase logs (Settings → Logs → Postgres)
3. Look for "permission denied for table StaffService" errors
4. Share the error message and I can help diagnose
