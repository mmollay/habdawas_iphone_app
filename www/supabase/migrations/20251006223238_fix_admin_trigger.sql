/*
  # Fix Admin Trigger

  1. Changes
    - Drop the problematic trigger
    - Create a simpler AFTER INSERT trigger that updates the profile
    - This avoids modifying NEW in a BEFORE trigger which can cause issues
    
  2. Security
    - Only office@ssi.at gets admin flag
    - Trigger runs with SECURITY DEFINER to bypass RLS
*/

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS set_admin_flag_trigger ON profiles;
DROP FUNCTION IF EXISTS set_admin_flag();

-- Create new function that runs AFTER insert
CREATE OR REPLACE FUNCTION set_admin_flag_after_insert()
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
    -- Update the profile to set is_admin = true
    UPDATE profiles
    SET is_admin = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create AFTER INSERT trigger
CREATE TRIGGER set_admin_flag_after_insert_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_flag_after_insert();
