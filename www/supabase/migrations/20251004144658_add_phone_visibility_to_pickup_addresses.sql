/*
  # Add Phone Visibility to Pickup Addresses

  1. Changes
    - Add `show_phone_publicly` boolean field to pickup_addresses table
    - Default to false (phone number hidden by default for privacy)
    - Remove `show_phone_number` from profiles table (moving logic to addresses)
  
  2. Security
    - No RLS changes needed - setting is part of existing address
*/

-- Add phone visibility to pickup addresses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pickup_addresses' AND column_name = 'show_phone_publicly'
  ) THEN
    ALTER TABLE pickup_addresses ADD COLUMN show_phone_publicly boolean DEFAULT false;
  END IF;
END $$;

-- Remove show_phone_number from profiles (no longer needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_phone_number'
  ) THEN
    ALTER TABLE profiles DROP COLUMN show_phone_number;
  END IF;
END $$;