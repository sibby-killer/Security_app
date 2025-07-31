-- Fix Supabase RLS Policies Only - SAFE VERSION
-- This script checks for table existence before creating policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing RLS policies (only for tables that exist)
DO $$
BEGIN
    -- Drop policies for profiles table
    DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
    
    -- Drop policies for incidents table
    DROP POLICY IF EXISTS "Anyone can view incidents" ON incidents;
    DROP POLICY IF EXISTS "Authenticated users can create incidents" ON incidents;
    DROP POLICY IF EXISTS "Reporters can update own incidents" ON incidents;
    DROP POLICY IF EXISTS "Admins can delete incidents" ON incidents;
    
    -- Drop policies for incident_photos table (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_photos') THEN
        DROP POLICY IF EXISTS "Anyone can view incident photos" ON incident_photos;
        DROP POLICY IF EXISTS "Authenticated users can upload photos" ON incident_photos;
        DROP POLICY IF EXISTS "Uploaders and admins can delete photos" ON incident_photos;
    END IF;
    
    -- Drop policies for comments table
    DROP POLICY IF EXISTS "Users can view non-internal comments" ON comments;
    DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
    DROP POLICY IF EXISTS "Users can update own comments" ON comments;
    
    -- Drop policies for notifications table
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    
    -- Drop policies for audit_logs table (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
    END IF;
    
    -- Drop policies for incident_assignments table (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_assignments') THEN
        DROP POLICY IF EXISTS "Anyone can view incident assignments" ON incident_assignments;
        DROP POLICY IF EXISTS "Admins and super admins can create assignments" ON incident_assignments;
        DROP POLICY IF EXISTS "Assigned security can update assignments" ON incident_assignments;
    END IF;
    
    -- Drop policies for incident_feedback table (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_feedback') THEN
        DROP POLICY IF EXISTS "Anyone can view incident feedback" ON incident_feedback;
        DROP POLICY IF EXISTS "Security can create feedback for assigned incidents" ON incident_feedback;
        DROP POLICY IF EXISTS "Security can update own feedback" ON incident_feedback;
        DROP POLICY IF EXISTS "Admins and super admins can approve feedback" ON incident_feedback;
    END IF;
END $$;

-- Step 2: Create helper functions to avoid circular references
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role IN ('admin', 'super_admin', 'security')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create new RLS policies for existing tables
-- For profiles table
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

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

-- For incident_photos (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_photos') THEN
        EXECUTE 'CREATE POLICY "Anyone can view incident photos" ON incident_photos FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can upload photos" ON incident_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by)';
        EXECUTE 'CREATE POLICY "Uploaders and admins can delete photos" ON incident_photos FOR DELETE TO authenticated USING (auth.uid() = uploaded_by OR is_admin(auth.uid()))';
    END IF;
END $$;

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

-- For audit_logs (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        EXECUTE 'CREATE POLICY "Super admins can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (is_super_admin(auth.uid()))';
    END IF;
END $$;

-- For incident_assignments (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_assignments') THEN
        EXECUTE 'CREATE POLICY "Anyone can view incident assignments" ON incident_assignments FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Admins and super admins can create assignments" ON incident_assignments FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()))';
        EXECUTE 'CREATE POLICY "Assigned security can update assignments" ON incident_assignments FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR is_admin(auth.uid()))';
    END IF;
END $$;

-- For incident_feedback (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_feedback') THEN
        EXECUTE 'CREATE POLICY "Anyone can view incident feedback" ON incident_feedback FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Security can create feedback for assigned incidents" ON incident_feedback FOR INSERT TO authenticated WITH CHECK (security_id = auth.uid() AND EXISTS (SELECT 1 FROM incidents WHERE id = incident_id AND assigned_to = auth.uid()))';
        EXECUTE 'CREATE POLICY "Security can update own feedback" ON incident_feedback FOR UPDATE TO authenticated USING (security_id = auth.uid() OR is_admin(auth.uid()))';
        EXECUTE 'CREATE POLICY "Admins and super admins can approve feedback" ON incident_feedback FOR UPDATE TO authenticated USING (is_admin(auth.uid()))';
    END IF;
END $$;

-- Step 4: Test the fix
-- You can run this query to test if the policies are working:
-- SELECT * FROM profiles LIMIT 1; 