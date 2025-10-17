/*
  # Add Shipping and Pickup Settings to Profiles

  1. Changes
    - Add shipping_enabled (boolean) - Whether user offers shipping
    - Add shipping_cost (numeric) - Shipping cost in euros
    - Add shipping_description (text) - Additional shipping info
    - Add pickup_enabled (boolean) - Whether pickup is allowed
    - Add show_location_publicly (boolean) - Show exact location to buyers
    - Add location_description (text) - Additional location/pickup info

  2. Notes
    - All fields are optional with sensible defaults
    - shipping_cost defaults to 0 (free shipping if enabled)
    - pickup_enabled defaults to true (most common case)
    - show_location_publicly defaults to false for privacy
*/

-- Add shipping settings columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shipping_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN shipping_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE profiles ADD COLUMN shipping_cost numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shipping_description'
  ) THEN
    ALTER TABLE profiles ADD COLUMN shipping_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pickup_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pickup_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_location_publicly'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_location_publicly boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_description'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_description text;
  END IF;
END $$;