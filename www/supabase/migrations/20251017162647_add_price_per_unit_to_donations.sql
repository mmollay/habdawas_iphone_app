-- Migration: Add price_per_unit to donations table
-- This stores the price per credit/listing at the time of donation
-- Important for historical accuracy and preventing confusion

ALTER TABLE donations
ADD COLUMN price_per_unit numeric DEFAULT 0.20 CHECK (price_per_unit >= 0);

COMMENT ON COLUMN donations.price_per_unit IS 'Price per credit or listing at the time of donation (in EUR). Stored for historical accuracy.';

-- Update existing records with the default value (0.20€)
UPDATE donations
SET price_per_unit = 0.20
WHERE price_per_unit IS NULL;

-- Make it NOT NULL after backfilling
ALTER TABLE donations
ALTER COLUMN price_per_unit SET NOT NULL;
