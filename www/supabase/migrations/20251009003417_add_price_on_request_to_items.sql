/*
  # Add price on request field

  1. Changes
    - Add `price_on_request` boolean field to `items` table
    - Default value is false
    - When true, the price is shown as "Auf Anfrage" (On Request)
  
  2. Notes
    - This is a non-destructive change
    - Existing items will have price_on_request set to false by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'price_on_request'
  ) THEN
    ALTER TABLE items ADD COLUMN price_on_request boolean DEFAULT false;
  END IF;
END $$;
