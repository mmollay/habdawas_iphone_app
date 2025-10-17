/*
  # Add Phone Visibility Setting

  1. Changes
    - Add `show_phone_number` boolean field to profiles table
    - Default to false (phone number hidden by default for privacy)
  
  2. Security
    - No RLS changes needed - setting is part of existing profile
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_phone_number boolean DEFAULT false;
  END IF;
END $$;