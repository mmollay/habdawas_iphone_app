/*
  # Admin Settings and User Management System

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `token_system_mode` (text) - 'enabled', 'donation_only', 'disabled'
      - `default_token_package` (integer) - default token amount for new users
      - `token_price_per_100` (numeric) - price per 100 tokens in euros
      - `platform_message` (text) - optional message to display to all users
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references profiles)

  2. Changes
    - Add `is_suspended` field to profiles table
    - Add `suspended_at` and `suspended_reason` fields to profiles table
    
  3. New Functions
    - `is_admin(user_email)` - checks if user is admin (office@ssi.at)
    - `get_all_users_admin()` - returns all users with their data for admin
    - `suspend_user_admin(user_id, reason)` - suspends a user
    - `delete_user_admin(user_id)` - deletes a user and all their data
    
  4. Security
    - Enable RLS on `system_settings` table
    - Only admin can read/update system settings
    - Only admin can manage users
    - Suspended users cannot create/update items
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_system_mode text NOT NULL DEFAULT 'enabled' CHECK (token_system_mode IN ('enabled', 'donation_only', 'disabled')),
  default_token_package integer NOT NULL DEFAULT 100,
  token_price_per_100 numeric(10,2) NOT NULL DEFAULT 1.99,
  platform_message text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Insert default settings
INSERT INTO system_settings (token_system_mode, default_token_package, token_price_per_100)
VALUES ('enabled', 100, 1.99)
ON CONFLICT DO NOTHING;

-- Add suspension fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspended_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'suspended_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspended_reason text;
  END IF;
END $$;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN user_email = 'office@ssi.at';
END;
$$;

-- Create function to get current user email
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT is_admin(get_user_email());
$$;

-- Create function to get all users for admin
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz,
  is_suspended boolean,
  suspended_at timestamptz,
  suspended_reason text,
  is_admin boolean,
  token_balance integer,
  item_count bigint,
  message_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.phone,
    p.created_at,
    p.is_suspended,
    p.suspended_at,
    p.suspended_reason,
    p.is_admin,
    COALESCE(p.token_balance, 0) as token_balance,
    COUNT(DISTINCT i.id) as item_count,
    COUNT(DISTINCT m.id) as message_count
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN items i ON i.user_id = p.id
  LEFT JOIN messages m ON m.sender_id = p.id OR m.receiver_id = p.id
  GROUP BY p.id, au.email, p.full_name, p.phone, p.created_at, p.is_suspended, 
           p.suspended_at, p.suspended_reason, p.is_admin, p.token_balance
  ORDER BY p.created_at DESC;
END;
$$;

-- Create function to suspend user
CREATE OR REPLACE FUNCTION suspend_user_admin(target_user_id uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Don't allow suspending admin
  IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Cannot suspend admin user.';
  END IF;

  UPDATE profiles
  SET 
    is_suspended = true,
    suspended_at = now(),
    suspended_reason = reason
  WHERE id = target_user_id;
END;
$$;

-- Create function to unsuspend user
CREATE OR REPLACE FUNCTION unsuspend_user_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  UPDATE profiles
  SET 
    is_suspended = false,
    suspended_at = NULL,
    suspended_reason = NULL
  WHERE id = target_user_id;
END;
$$;

-- Create function to delete user
CREATE OR REPLACE FUNCTION delete_user_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Don't allow deleting admin
  IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Cannot delete admin user.';
  END IF;

  -- Delete user's data (cascading will handle related records)
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (this will cascade to profiles if not already deleted)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read system settings
CREATE POLICY "Admin can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (is_current_user_admin());

-- Admin can update system settings
CREATE POLICY "Admin can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Create index for suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended) WHERE is_suspended = true;

-- Update items policies to prevent suspended users from creating/updating items
DROP POLICY IF EXISTS "Users can create items" ON items;
CREATE POLICY "Users can create items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_suspended = true)
  );

DROP POLICY IF EXISTS "Users can update own items" ON items;
CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_suspended = true)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_suspended = true)
  );

-- Admin can update ANY item
CREATE POLICY "Admin can update any item"
  ON items FOR UPDATE
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());
