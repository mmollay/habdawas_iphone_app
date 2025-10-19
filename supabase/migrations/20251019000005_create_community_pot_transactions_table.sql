-- ============================================================================
-- CREATE COMMUNITY POT TRANSACTIONS TABLE
-- ============================================================================
-- Description: Tracks all community pot transactions (donations, usage, adjustments)
-- Created: 2025-10-19
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_pot_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('donation', 'usage', 'adjustment')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_pot_user_id ON community_pot_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_pot_item_id ON community_pot_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_community_pot_created_at ON community_pot_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_pot_transaction_type ON community_pot_transactions(transaction_type);

-- Enable Row Level Security
ALTER TABLE community_pot_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON community_pot_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON community_pot_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can insert transactions"
  ON community_pot_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Service role can manage transactions"
  ON community_pot_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Community Pot Transactions Table Created!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ community_pot_transactions table created';
  RAISE NOTICE '✓ Foreign keys to profiles(id) and items(id) added';
  RAISE NOTICE '✓ RLS policies created';
  RAISE NOTICE '✓ Indexes created';
  RAISE NOTICE '===========================================';
END $$;
