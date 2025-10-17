/*
  # Automatically Set Admin Flag for office@ssi.at

  1. Changes
    - Create trigger function to automatically set is_admin = true for office@ssi.at
    - Apply trigger to profiles table on INSERT
    - Update existing office@ssi.at profile if it exists
    
  2. Security
    - Only office@ssi.at gets admin flag automatically
    - Trigger runs with SECURITY DEFINER to bypass RLS
*/

-- Create function to set admin flag
CREATE OR REPLACE FUNCTION set_admin_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user's email is office@ssi.at
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = NEW.id 
    AND email = 'office@ssi.at'
  ) THEN
    NEW.is_admin := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS set_admin_flag_trigger ON profiles;
CREATE TRIGGER set_admin_flag_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_flag();

-- Update existing profile if office@ssi.at already exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user_id for office@ssi.at
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'office@ssi.at';
  
  -- If user exists, update their profile
  IF admin_user_id IS NOT NULL THEN
    UPDATE profiles
    SET is_admin = true
    WHERE id = admin_user_id;
  END IF;
END $$;
