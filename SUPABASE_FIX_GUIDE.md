# Supabase Issues Fix Guide

## Issues Identified

1. **Infinite Recursion Error**: `infinite recursion detected in policy for relation "profiles"`
2. **Connection Errors**: `ERR_CONNECTION_RESET` and `ERR_NAME_NOT_RESOLVED`
3. **500 Internal Server Errors**: Database policy conflicts
4. **Authentication Issues**: 400 and 429 errors

## Root Cause

The main issue is in the Row Level Security (RLS) policies for the `profiles` table. The policies are creating circular references by trying to query the `profiles` table within the policy itself.

## Solution Steps

### Step 1: Fix Database Policies

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Fix Supabase Infinite Recursion Issues
-- Run this script in your Supabase SQL editor

-- Step 1: Drop all existing RLS policies to clean slate
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view incidents" ON incidents;
DROP POLICY IF EXISTS "Authenticated users can create incidents" ON incidents;
DROP POLICY IF EXISTS "Reporters can update own incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can delete incidents" ON incidents;
DROP POLICY IF EXISTS "Anyone can view incident photos" ON incident_photos;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON incident_photos;
DROP POLICY IF EXISTS "Uploaders and admins can delete photos" ON incident_photos;
DROP POLICY IF EXISTS "Users can view non-internal comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can view incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Admins and super admins can create assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assigned security can update assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Anyone can view incident feedback" ON incident_feedback;
DROP POLICY IF EXISTS "Security can create feedback for assigned incidents" ON incident_feedback;
DROP POLICY IF EXISTS "Security can update own feedback" ON incident_feedback;
DROP POLICY IF EXISTS "Admins and super admins can approve feedback" ON incident_feedback;

-- Step 2: Create new RLS policies without circular references
-- For profiles table - use a simpler approach
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- For admin access, we'll use a different approach - create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role IN ('admin', 'super_admin', 'security')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin policy using the function
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- For incidents
CREATE POLICY "Anyone can view incidents" ON incidents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create incidents" ON incidents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can update own incidents" ON incidents
  FOR UPDATE TO authenticated USING (
    auth.uid() = reporter_id OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete incidents" ON incidents
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- For incident_photos
CREATE POLICY "Anyone can view incident photos" ON incident_photos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload photos" ON incident_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploaders and admins can delete photos" ON incident_photos
  FOR DELETE TO authenticated USING (
    auth.uid() = uploaded_by OR is_admin(auth.uid())
  );

-- For comments
CREATE POLICY "Users can view non-internal comments" ON comments
  FOR SELECT TO authenticated USING (
    NOT is_internal OR is_admin(auth.uid())
  );

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- For notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- For audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- For incident_assignments
CREATE POLICY "Anyone can view incident assignments" ON incident_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and super admins can create assignments" ON incident_assignments
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Assigned security can update assignments" ON incident_assignments
  FOR UPDATE TO authenticated USING (
    assigned_to = auth.uid() OR is_admin(auth.uid())
  );

-- For incident_feedback
CREATE POLICY "Anyone can view incident feedback" ON incident_feedback
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Security can create feedback for assigned incidents" ON incident_feedback
  FOR INSERT TO authenticated WITH CHECK (
    security_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE id = incident_id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "Security can update own feedback" ON incident_feedback
  FOR UPDATE TO authenticated USING (
    security_id = auth.uid() OR is_admin(auth.uid())
  );

CREATE POLICY "Admins and super admins can approve feedback" ON incident_feedback
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Step 3: Create a function to check if user is super admin (for more restrictive operations)
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update audit logs policy to use super admin function
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Super admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));
```

### Step 2: Check Supabase Configuration

1. **Verify Environment Variables**: Make sure your Supabase URL and API key are correct in your environment variables.

2. **Check Supabase Project Status**: 
   - Go to your Supabase dashboard
   - Check if your project is active and not paused
   - Verify the project ID matches: `xeagkjuvgqbtfexcdspa`

3. **Check API Limits**: The 429 errors suggest you might be hitting rate limits. Check your Supabase usage.

### Step 3: Update Frontend Error Handling

Add better error handling to your React components. Here's an example for the AdminPanel:

```typescript
// In your AdminPanel.tsx or similar components
const fetchAdminData = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching admin data:', error);
      // Handle specific error types
      if (error.code === '42P17') {
        setError('Database policy error - please contact administrator');
      } else if (error.code === 'PGRST301') {
        setError('Authentication error - please log in again');
      } else {
        setError('Failed to fetch data: ' + error.message);
      }
      return;
    }
    
    setProfiles(data || []);
  } catch (err) {
    console.error('Unexpected error:', err);
    setError('An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Test the Fix

1. **Run the SQL script** in your Supabase SQL Editor
2. **Restart your development server**
3. **Test the application** - try logging in and accessing different pages
4. **Check the browser console** for any remaining errors

### Step 5: Additional Troubleshooting

If you still have issues:

1. **Clear browser cache and cookies**
2. **Check network connectivity**
3. **Verify Supabase project settings**:
   - Go to Settings > API in your Supabase dashboard
   - Check if the API keys are correct
   - Verify the project URL

4. **Check for CORS issues**:
   - In Supabase dashboard, go to Settings > API
   - Add your localhost URL to the allowed origins

## Prevention

To prevent similar issues in the future:

1. **Always test RLS policies** before deploying to production
2. **Use helper functions** for complex policy logic
3. **Avoid circular references** in database policies
4. **Implement proper error handling** in your frontend code

## Contact Support

If the issues persist after following these steps:

1. Check your Supabase project logs
2. Contact Supabase support with the error details
3. Consider creating a new Supabase project and migrating the data

## Files Created

- `supabase/schema_fixed.sql` - Complete fixed schema
- `fix_supabase_issues.sql` - Quick fix script
- `SUPABASE_FIX_GUIDE.md` - This guide 