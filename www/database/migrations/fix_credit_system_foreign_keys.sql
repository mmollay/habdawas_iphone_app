-- ============================================================================
-- FIX CREDIT SYSTEM FOREIGN KEYS
-- ============================================================================
-- Add foreign key relationships to profiles table for proper Supabase joins
-- Created: 2025-10-17
-- ============================================================================

-- Add foreign key from donations to profiles
-- Note: We keep the existing auth.users FK, just add an additional one to profiles
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

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Foreign keys added successfully';
  RAISE NOTICE 'donations.user_id now references profiles(id)';
  RAISE NOTICE 'community_pot_transactions.user_id now references profiles(id)';
END $$;
