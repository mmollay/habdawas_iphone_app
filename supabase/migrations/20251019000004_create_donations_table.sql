-- ============================================================================
-- CREATE DONATIONS TABLE
-- ============================================================================
-- Description: User donations for purchasing credits
-- Created: 2025-10-19
-- ============================================================================

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  credits_granted INTEGER NOT NULL CHECK (credits_granted >= 0),
  price_per_unit NUMERIC(10, 2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status);

-- Enable Row Level Security
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own donations"
  ON donations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all donations"
  ON donations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Service role can manage donations"
  ON donations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donations_updated_at_trigger
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donations_updated_at();

-- Verification
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Donations Table Created Successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ donations table created';
  RAISE NOTICE '✓ Foreign key to profiles(id) added';
  RAISE NOTICE '✓ RLS policies created';
  RAISE NOTICE '✓ Indexes created';
  RAISE NOTICE '===========================================';
END $$;
