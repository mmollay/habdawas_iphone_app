/*
  # Create Roles and Permissions System

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique) - role name (e.g., 'admin', 'moderator', 'support')
      - `display_name` (text) - human-readable name
      - `description` (text) - role description
      - `created_at` (timestamptz)
      
    - `permissions`
      - `id` (uuid, primary key)
      - `name` (text, unique) - permission name (e.g., 'items.approve', 'items.delete', 'users.suspend')
      - `display_name` (text) - human-readable name
      - `description` (text) - permission description
      - `category` (text) - permission category (e.g., 'items', 'users', 'system')
      - `created_at` (timestamptz)
      
    - `role_permissions`
      - `role_id` (uuid, references roles)
      - `permission_id` (uuid, references permissions)
      - Primary key: (role_id, permission_id)
      
    - `user_roles`
      - `user_id` (uuid, references profiles)
      - `role_id` (uuid, references roles)
      - `assigned_by` (uuid, references profiles)
      - `assigned_at` (timestamptz)
      - Primary key: (user_id, role_id)

  2. Changes
    - Keep `is_admin` field for backward compatibility
    - Super admin (office@ssi.at) automatically gets all permissions

  3. Security
    - Enable RLS on all new tables
    - Only admins can view/manage roles and permissions
    - Create helper functions to check permissions

  4. Initial Data
    - Create predefined roles: admin, moderator, support
    - Create comprehensive permission set
    - Assign permissions to roles
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Insert predefined roles
INSERT INTO roles (name, display_name, description) VALUES
  ('admin', 'Administrator', 'Full system access with all permissions'),
  ('moderator', 'Moderator', 'Can approve, reject, and manage items'),
  ('support', 'Support', 'Can view user data and assist users'),
  ('content_reviewer', 'Content Reviewer', 'Can review and approve content')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
  -- Item permissions
  ('items.view_all', 'View All Items', 'Can view all items including drafts and unlisted', 'items'),
  ('items.approve', 'Approve Items', 'Can approve items for publication', 'items'),
  ('items.reject', 'Reject Items', 'Can reject or hide items', 'items'),
  ('items.delete', 'Delete Items', 'Can delete any item', 'items'),
  ('items.edit_any', 'Edit Any Item', 'Can edit any user''s items', 'items'),
  ('items.feature', 'Feature Items', 'Can mark items as featured', 'items'),
  
  -- User permissions
  ('users.view_all', 'View All Users', 'Can view all user data', 'users'),
  ('users.suspend', 'Suspend Users', 'Can suspend user accounts', 'users'),
  ('users.delete', 'Delete Users', 'Can delete user accounts', 'users'),
  ('users.edit_tokens', 'Edit User Tokens', 'Can modify user token balances', 'users'),
  ('users.view_activity', 'View User Activity', 'Can view user activity and history', 'users'),
  
  -- Role and permission management
  ('roles.view', 'View Roles', 'Can view roles and permissions', 'roles'),
  ('roles.assign', 'Assign Roles', 'Can assign roles to users', 'roles'),
  ('roles.manage', 'Manage Roles', 'Can create, edit, and delete roles', 'roles'),
  
  -- System permissions
  ('system.settings', 'System Settings', 'Can modify system settings', 'system'),
  ('system.analytics', 'View Analytics', 'Can view system analytics and reports', 'system'),
  
  -- Message permissions
  ('messages.view_all', 'View All Messages', 'Can view all user messages', 'messages'),
  ('messages.moderate', 'Moderate Messages', 'Can moderate and delete messages', 'messages')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
  admin_role_id uuid;
  moderator_role_id uuid;
  support_role_id uuid;
  reviewer_role_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO moderator_role_id FROM roles WHERE name = 'moderator';
  SELECT id INTO support_role_id FROM roles WHERE name = 'support';
  SELECT id INTO reviewer_role_id FROM roles WHERE name = 'content_reviewer';

  -- Admin gets all permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM permissions
  ON CONFLICT DO NOTHING;

  -- Moderator permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT moderator_role_id, id FROM permissions WHERE name IN (
    'items.view_all',
    'items.approve',
    'items.reject',
    'items.edit_any',
    'items.feature',
    'users.view_all',
    'users.view_activity',
    'messages.view_all',
    'messages.moderate'
  )
  ON CONFLICT DO NOTHING;

  -- Support permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT support_role_id, id FROM permissions WHERE name IN (
    'items.view_all',
    'users.view_all',
    'users.view_activity',
    'messages.view_all'
  )
  ON CONFLICT DO NOTHING;

  -- Content Reviewer permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT reviewer_role_id, id FROM permissions WHERE name IN (
    'items.view_all',
    'items.approve',
    'items.reject'
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- RLS Policies for permissions
CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- RLS Policies for role_permissions
CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_current_user_admin());

CREATE POLICY "Admin can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Helper function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(check_user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Super admin always has all permissions
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = check_user_id AND is_admin = true
  ) THEN
    RETURN true;
  END IF;

  -- Check if user has the permission through any of their roles
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = check_user_id
      AND p.name = permission_name
  );
END;
$$;

-- Helper function to check if current user has a specific permission
CREATE OR REPLACE FUNCTION current_user_has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_has_permission(auth.uid(), permission_name);
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(check_user_id uuid)
RETURNS TABLE (
  permission_name text,
  display_name text,
  description text,
  category text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Super admin gets all permissions
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = check_user_id AND is_admin = true
  ) THEN
    RETURN QUERY
    SELECT p.name, p.display_name, p.description, p.category
    FROM permissions p
    ORDER BY p.category, p.name;
  ELSE
    -- Get permissions from user's roles
    RETURN QUERY
    SELECT DISTINCT p.name, p.display_name, p.description, p.category
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = check_user_id
    ORDER BY p.category, p.name;
  END IF;
END;
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION get_user_roles(check_user_id uuid)
RETURNS TABLE (
  role_id uuid,
  role_name text,
  display_name text,
  description text,
  assigned_at timestamptz,
  assigned_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.display_name, r.description, ur.assigned_at, ur.assigned_by
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = check_user_id
  ORDER BY ur.assigned_at DESC;
END;
$$;

-- Function to assign role to user (admin only)
CREATE OR REPLACE FUNCTION assign_role_to_user(target_user_id uuid, target_role_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (target_user_id, target_role_id, auth.uid())
  ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$;

-- Function to remove role from user (admin only)
CREATE OR REPLACE FUNCTION remove_role_from_user(target_user_id uuid, target_role_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  DELETE FROM user_roles
  WHERE user_id = target_user_id AND role_id = target_role_id;
END;
$$;

-- Function to get all roles with their permissions (admin only)
CREATE OR REPLACE FUNCTION get_all_roles_with_permissions()
RETURNS TABLE (
  role_id uuid,
  role_name text,
  display_name text,
  description text,
  permission_count bigint,
  user_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.display_name,
    r.description,
    COUNT(DISTINCT rp.permission_id) as permission_count,
    COUNT(DISTINCT ur.user_id) as user_count
  FROM roles r
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
  LEFT JOIN user_roles ur ON ur.role_id = r.id
  GROUP BY r.id, r.name, r.display_name, r.description
  ORDER BY r.name;
END;
$$;
