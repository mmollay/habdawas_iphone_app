-- ============================================================================
-- FIX CREDIT SYSTEM CONSTRAINTS AND FOREIGN KEYS
-- ============================================================================
-- Fix donations amount constraint to allow admin grants with 0 amount
-- Fix foreign key relationships for proper Supabase joins
-- Created: 2025-10-17
-- ============================================================================

-- ============================================================================
-- 1. FIX DONATIONS TABLE CONSTRAINTS
-- ============================================================================

-- Drop the old constraint that requires amount > 0
ALTER TABLE donations
DROP CONSTRAINT IF EXISTS donations_amount_check;

-- Add new constraint that allows amount >= 0 (for admin grants)
ALTER TABLE donations
ADD CONSTRAINT donations_amount_check CHECK (amount >= 0);

-- Also ensure credits_granted can be positive (existing constraint is fine)
-- But let's verify it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'donations'
    AND constraint_name = 'donations_credits_granted_check'
  ) THEN
    ALTER TABLE donations
    ADD CONSTRAINT donations_credits_granted_check CHECK (credits_granted >= 0);
  END IF;
END $$;

-- ============================================================================
-- 2. FIX FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- First, drop the existing auth.users foreign keys
ALTER TABLE donations
DROP CONSTRAINT IF EXISTS donations_user_id_fkey;

ALTER TABLE community_pot_transactions
DROP CONSTRAINT IF EXISTS community_pot_transactions_user_id_fkey;

-- Add foreign keys to profiles table instead
ALTER TABLE donations
DROP CONSTRAINT IF EXISTS donations_user_id_profiles_fkey;

ALTER TABLE donations
ADD CONSTRAINT donations_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key from community_pot_transactions to profiles
ALTER TABLE community_pot_transactions
DROP CONSTRAINT IF EXISTS community_pot_transactions_user_id_profiles_fkey;

ALTER TABLE community_pot_transactions
ADD CONSTRAINT community_pot_transactions_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. VERIFY CHANGES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ donations.amount now allows >= 0 (admin grants)';
  RAISE NOTICE '✓ donations.user_id now references profiles(id)';
  RAISE NOTICE '✓ community_pot_transactions.user_id now references profiles(id)';
  RAISE NOTICE '===========================================';
END $$;
