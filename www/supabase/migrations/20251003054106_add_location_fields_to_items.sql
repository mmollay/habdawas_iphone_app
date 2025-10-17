/*
  # Add Location Fields to Items Table

  ## Overview
  Adds postal code (PLZ) and location (Ort) fields to items table to display item location.

  ## Changes to `items` table
  - `postal_code` (text, nullable) - Postal code (PLZ)
  - `location` (text, nullable) - City/town name (Ort)

  ## Notes
  - Fields are nullable as they may not always be provided
  - No RLS policy changes needed as existing policies cover these fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE items ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'location'
  ) THEN
    ALTER TABLE items ADD COLUMN location text;
  END IF;
END $$;