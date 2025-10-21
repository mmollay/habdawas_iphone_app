-- Migration: Add birth_timezone to profiles
-- Description: Adds timezone field for accurate astrological calculations
-- Created: 2025-10-21

-- Add birth_timezone field
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_timezone VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN profiles.birth_timezone IS 'Timezone at birth for accurate astrological calculations (e.g., Europe/Vienna)';

-- Verification
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Birth Timezone Field Added Successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ birth_timezone column added to profiles';
  RAISE NOTICE '===========================================';
END $$;
