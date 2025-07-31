/*
  # Community Security Alert App Database Schema - FIXED VERSION

  Fixed RLS policies to prevent infinite recursion
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('resident', 'admin', 'super_admin', 'security');
CREATE TYPE incident_status AS ENUM ('reported', 'assigned', 'in_progress', 'feedback_pending', 'feedback_submitted', 'feedback_approved', 'resolved', 'closed');
CREATE TYPE incident_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notification_type AS ENUM ('incident_created', 'incident_assigned', 'incident_updated', 'status_changed', 'comment_added', 'feedback_submitted', 'feedback_approved', 'incident_resolved');
CREATE TYPE feedback_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  email text UNIQUE NOT NULL,
  role user_role DEFAULT 'resident'::user_role,
  avatar_url text,
  phone text,
  address text,
  notification_preferences jsonb DEFAULT '{"email": true, "push": true}'::jsonb,
  is_active boolean DEFAULT true,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location_lat double precision NOT NULL,
  location_lng double precision NOT NULL,
  address text,
  status incident_status DEFAULT 'reported'::incident_status,
  priority incident_priority DEFAULT 'medium'::incident_priority,
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  category text,
  tags text[] DEFAULT '{}',
  is_anonymous boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Incident assignments table (for tracking assignment history)
CREATE TABLE IF NOT EXISTS incident_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  notes text,
  status incident_status DEFAULT 'assigned'::incident_status
);

-- Incident feedback table
CREATE TABLE IF NOT EXISTS incident_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  security_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  status feedback_status DEFAULT 'pending'::feedback_status,
  submitted_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  approved_by_reporter boolean DEFAULT false,
  reporter_approved_at timestamptz,
  admin_approved_at timestamptz,
  admin_approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Incident photos table
CREATE TABLE IF NOT EXISTS incident_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  description text,
  is_verified boolean DEFAULT false
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority integer DEFAULT 1,
  action_required boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST (ll_to_earth(location_lat, location_lng));
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_comments_incident ON comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_incident ON incident_assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_assigned_to ON incident_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incident_feedback_incident ON incident_feedback(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_feedback_security ON incident_feedback(security_id);
CREATE INDEX IF NOT EXISTS idx_incident_feedback_status ON incident_feedback(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_feedback ENABLE ROW LEVEL SECURITY;

-- FIXED RLS Policies for profiles (no circular references)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- FIXED: Use auth.jwt() to check role instead of querying profiles table
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin', 'security')
  );

-- RLS Policies for incidents
CREATE POLICY "Anyone can view incidents" ON incidents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create incidents" ON incidents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can update own incidents" ON incidents
  FOR UPDATE TO authenticated USING (
    auth.uid() = reporter_id OR
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin', 'security')
  );

CREATE POLICY "Admins can delete incidents" ON incidents
  FOR DELETE TO authenticated USING (
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin', 'security')
  );

-- RLS Policies for incident_photos
CREATE POLICY "Anyone can view incident photos" ON incident_photos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload photos" ON incident_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploaders and admins can delete photos" ON incident_photos
  FOR DELETE TO authenticated USING (
    auth.uid() = uploaded_by OR
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin', 'security')
  );

-- RLS Policies for comments
CREATE POLICY "Users can view non-internal comments" ON comments
  FOR SELECT TO authenticated USING (
    NOT is_internal OR
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin', 'security')
  );

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
  );

-- RLS Policies for incident_assignments
CREATE POLICY "Anyone can view incident assignments" ON incident_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and super admins can create assignments" ON incident_assignments
  FOR INSERT TO authenticated WITH CHECK (
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
  );

CREATE POLICY "Assigned security can update assignments" ON incident_assignments
  FOR UPDATE TO authenticated USING (
    assigned_to = auth.uid() OR
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
  );

-- RLS Policies for incident_feedback
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
    security_id = auth.uid() OR
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins and super admins can approve feedback" ON incident_feedback
  FOR UPDATE TO authenticated USING (
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Function to create notifications for incident events
CREATE OR REPLACE FUNCTION public.create_incident_notification(
  p_user_id uuid,
  p_incident_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_priority integer DEFAULT 1,
  p_action_required boolean DEFAULT false
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (
    user_id, incident_id, type, title, message, priority, action_required
  ) VALUES (
    p_user_id, p_incident_id, p_type, p_title, p_message, p_priority, p_action_required
  );
END;
$$ language plpgsql security definer;

-- Function to notify admins and security about new incidents
CREATE OR REPLACE FUNCTION public.notify_incident_created()
RETURNS trigger AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Notify all admins and security personnel
  FOR admin_user IN 
    SELECT id, full_name FROM profiles 
    WHERE role IN ('admin', 'super_admin', 'security') AND is_active = true
  LOOP
    PERFORM create_incident_notification(
      admin_user.id,
      NEW.id,
      'incident_created',
      'New Security Incident Reported',
      'A new security incident has been reported: ' || NEW.title,
      2,
      true
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Function to notify when incident is assigned
CREATE OR REPLACE FUNCTION public.notify_incident_assigned()
RETURNS trigger AS $$
BEGIN
  -- Notify the assigned security personnel
  IF NEW.assigned_to IS NOT NULL THEN
    PERFORM create_incident_notification(
      NEW.assigned_to,
      NEW.id,
      'incident_assigned',
      'Incident Assigned to You',
      'You have been assigned to handle incident: ' || NEW.title,
      2,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Function to notify when feedback is submitted
CREATE OR REPLACE FUNCTION public.notify_feedback_submitted()
RETURNS trigger AS $$
DECLARE
  incident_record RECORD;
BEGIN
  -- Get incident details
  SELECT title, reporter_id INTO incident_record FROM incidents WHERE id = NEW.incident_id;
  
  -- Notify the incident reporter
  IF incident_record.reporter_id IS NOT NULL THEN
    PERFORM create_incident_notification(
      incident_record.reporter_id,
      NEW.incident_id,
      'feedback_submitted',
      'Feedback Submitted for Your Incident',
      'Security personnel have submitted feedback for incident: ' || incident_record.title,
      1,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language plpgsql security definer;

-- Create triggers
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER incidents_notification_trigger
  AFTER INSERT ON incidents
  FOR EACH ROW EXECUTE FUNCTION public.notify_incident_created();

CREATE TRIGGER incidents_assignment_notification_trigger
  AFTER UPDATE OF assigned_to ON incidents
  FOR EACH ROW EXECUTE FUNCTION public.notify_incident_assigned();

CREATE TRIGGER feedback_notification_trigger
  AFTER INSERT ON incident_feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_feedback_submitted();

CREATE TRIGGER incidents_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON incidents
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER profiles_audit_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail(); 