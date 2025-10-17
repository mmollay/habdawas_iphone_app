/*
  # Task Management System

  1. New Tables
    - `admin_tasks`
      - `id` (uuid, primary key)
      - `title` (text) - Task title
      - `description` (text, nullable) - Detailed description
      - `category` (text) - Category: 'moderation', 'feature', 'bug', 'improvement', 'documentation', 'other'
      - `priority` (text) - Priority: 'low', 'medium', 'high', 'urgent'
      - `status` (text) - Status: 'todo', 'in_progress', 'done', 'cancelled'
      - `estimated_hours` (integer, nullable) - Estimated effort in hours
      - `assigned_to` (uuid, nullable) - References auth.users(id)
      - `created_by` (uuid) - References auth.users(id)
      - `due_date` (timestamptz, nullable) - Optional deadline
      - `completed_at` (timestamptz, nullable) - When task was completed
      - `created_at` (timestamptz) - When task was created
      - `updated_at` (timestamptz) - When task was last updated

  2. Security
    - Enable RLS on `admin_tasks` table
    - Only admins and moderators can view tasks
    - Only admins can create, update, and delete tasks
*/

CREATE TABLE IF NOT EXISTS admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('moderation', 'feature', 'bug', 'improvement', 'documentation', 'other')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  estimated_hours integer,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and moderators can view all tasks
CREATE POLICY "Admins and moderators can view tasks"
  ON admin_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'moderator')
      )
    )
  );

-- Policy: Only admins can insert tasks
CREATE POLICY "Admins can create tasks"
  ON admin_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Only admins can update tasks
CREATE POLICY "Admins can update tasks"
  ON admin_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Only admins can delete tasks
CREATE POLICY "Admins can delete tasks"
  ON admin_tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_priority ON admin_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned_to ON admin_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_created_by ON admin_tasks(created_by);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Automatically set completed_at when status changes to 'done'
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  END IF;
  
  -- Clear completed_at if status changes from 'done' to something else
  IF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_tasks_updated_at_trigger
  BEFORE UPDATE ON admin_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_tasks_updated_at();