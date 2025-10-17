/*
  # Add price negotiable and free/giveaway fields to items

  1. Changes
    - Add `price_negotiable` boolean field to items table (default false)
    - Add `is_free` boolean field to items table (default false)
    - These fields allow users to mark items as negotiable or free/giveaway
    
  2. Notes
    - `price_negotiable`: When true, indicates price is negotiable (VB - Verhandlungsbasis)
    - `is_free`: When true, item is being given away for free (price should be 0)
    - Both fields are per-item and not global settings as they are highly individual
*/

DO $$
BEGIN
  -- Add price_negotiable field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'price_negotiable'
  ) THEN
    ALTER TABLE items ADD COLUMN price_negotiable boolean DEFAULT false;
  END IF;

  -- Add is_free field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'is_free'
  ) THEN
    ALTER TABLE items ADD COLUMN is_free boolean DEFAULT false;
  END IF;
END $$;