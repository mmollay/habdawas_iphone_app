/*
  # Create Admin System

  1. New Tables
    - `platform_settings`
      - `id` (uuid, primary key)
      - `token_system_enabled` (boolean) - Enable/disable token purchases
      - `donation_only_mode` (boolean) - Only show donation packages
      - `free_mode` (boolean) - Disable all payments, free for everyone
      - `maintenance_mode` (boolean) - Platform maintenance
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references profiles)

  2. Changes to profiles
    - Add `is_admin` (boolean) - Admin role flag
    - Add `is_banned` (boolean) - User ban flag
    - Add `banned_at` (timestamptz) - When user was banned
    - Add `banned_by` (uuid) - Admin who banned the user
    - Add `ban_reason` (text) - Reason for ban

  3. Security
    - Enable RLS on platform_settings
    - Only admins can read platform_settings
    - Only admins can update platform_settings
    - Add policies for admin-only access
    - Function to check if user is admin
*/

-- Add admin and ban fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Set office@ssi.at as admin (if profile exists)
UPDATE profiles
SET is_admin = true
WHERE email = 'office@ssi.at';

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_system_enabled BOOLEAN DEFAULT true,
  donation_only_mode BOOLEAN DEFAULT false,
  free_mode BOOLEAN DEFAULT false,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default settings
INSERT INTO platform_settings (token_system_enabled, donation_only_mode, free_mode, maintenance_mode)
VALUES (true, false, false, false)
ON CONFLICT DO NOTHING;

-- Enable RLS on platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for platform_settings (admin only)
CREATE POLICY "Admins can read platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

CREATE POLICY "Admins can update platform settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Update profiles RLS to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Allow admins to view all items
CREATE POLICY "Admins can view all items"
  ON items FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

CREATE POLICY "Admins can update all items"
  ON items FOR UPDATE
  TO authenticated
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

CREATE POLICY "Admins can delete all items"
  ON items FOR DELETE
  TO authenticated
  USING (current_user_is_admin());

-- Allow admins to view all messages
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

-- Allow admins to view all token transactions
CREATE POLICY "Admins can view all token transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

-- Allow admins to view all user tokens
CREATE POLICY "Admins can view all user tokens"
  ON user_tokens FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

CREATE POLICY "Admins can update all user tokens"
  ON user_tokens FOR UPDATE
  TO authenticated
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Function to ban user (admin only)
CREATE OR REPLACE FUNCTION ban_user(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin
  IF NOT current_user_is_admin() THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;

  -- Ban the user
  UPDATE profiles
  SET 
    is_banned = true,
    banned_at = now(),
    banned_by = auth.uid(),
    ban_reason = p_reason
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unban user (admin only)
CREATE OR REPLACE FUNCTION unban_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin
  IF NOT current_user_is_admin() THEN
    RAISE EXCEPTION 'Only admins can unban users';
  END IF;

  -- Unban the user
  UPDATE profiles
  SET 
    is_banned = false,
    banned_at = NULL,
    banned_by = NULL,
    ban_reason = NULL
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prevent banned users from creating items
CREATE POLICY "Banned users cannot create items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_banned = true
    )
  );

-- Prevent banned users from sending messages
CREATE POLICY "Banned users cannot send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_banned = true
    )
  );
