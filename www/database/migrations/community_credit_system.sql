-- ============================================================================
-- COMMUNITY CREDIT SYSTEM - Database Migration
-- ============================================================================
-- Version: 1.0
-- Description: Community-Spendentopf + Power-User Credit System
-- Created: 2025-10-17
-- ============================================================================

-- ============================================================================
-- 1. CREDIT SYSTEM SETTINGS TABLE
-- ============================================================================
-- Globale Einstellungen für das Community-Credit-System

CREATE TABLE IF NOT EXISTS credit_system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS für credit_system_settings
ALTER TABLE credit_system_settings ENABLE ROW LEVEL SECURITY;

-- Nur Admins können lesen
CREATE POLICY "Admins can read credit settings" ON credit_system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Nur Admins können schreiben
CREATE POLICY "Admins can update credit settings" ON credit_system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Initial Settings einfügen
INSERT INTO credit_system_settings (setting_key, setting_value, description) VALUES
  ('daily_free_listings', '5', 'Anzahl kostenloser Inserate pro Tag für alle User'),
  ('cost_per_listing', '0.20', 'Kosten pro Inserat in EUR (für Berechnungen)'),
  ('community_pot_balance', '0', 'Aktueller Community-Topf Saldo (Anzahl Inserate)'),
  ('power_user_credit_price', '0.20', 'Preis pro Power-User Credit in EUR'),
  ('min_donation_amount', '5.00', 'Minimaler Spendenbetrag in EUR'),
  ('power_user_min_purchase', '10.00', 'Minimaler Power-User Kauf in EUR'),
  ('low_pot_warning_threshold', '100', 'Warnschwelle für niedrigen Community-Topf')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 2. DONATIONS TABLE
-- ============================================================================
-- Tracking aller Spenden (Community + Personal)

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  donation_type text NOT NULL CHECK (donation_type IN ('community_pot', 'personal_credits')),
  credits_granted integer NOT NULL CHECK (credits_granted > 0),
  stripe_payment_id text,
  stripe_session_id text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_payment_id ON donations(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_type ON donations(donation_type);

-- RLS für donations
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- User können eigene Spenden sehen
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins können alle Spenden sehen
CREATE POLICY "Admins can view all donations" ON donations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- System kann Spenden erstellen (via Service Role)
CREATE POLICY "Service can insert donations" ON donations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 3. COMMUNITY POT TRANSACTIONS TABLE
-- ============================================================================
-- Transparenz-Log für alle Community-Topf Transaktionen

CREATE TABLE IF NOT EXISTS community_pot_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('donation', 'usage', 'adjustment')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount integer NOT NULL, -- Positive = Einzahlung, Negative = Nutzung
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  description text,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL, -- Falls 'usage'
  donation_id uuid REFERENCES donations(id) ON DELETE SET NULL, -- Falls 'donation'
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pot_transactions_created_at ON community_pot_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pot_transactions_type ON community_pot_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_pot_transactions_user ON community_pot_transactions(user_id);

-- RLS - Alle authentifizierten User können lesen (Transparenz!)
ALTER TABLE community_pot_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pot transactions" ON community_pot_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Nur System kann schreiben
CREATE POLICY "Service can insert pot transactions" ON community_pot_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 4. EXTEND PROFILES TABLE
-- ============================================================================
-- Füge Credit-relevante Felder zu profiles hinzu

DO $$
BEGIN
  -- Personal Credits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'personal_credits') THEN
    ALTER TABLE profiles ADD COLUMN personal_credits integer DEFAULT 0 CHECK (personal_credits >= 0);
  END IF;

  -- Total Donated
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'total_donated') THEN
    ALTER TABLE profiles ADD COLUMN total_donated numeric(10,2) DEFAULT 0 CHECK (total_donated >= 0);
  END IF;

  -- Community Listings Donated
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'community_listings_donated') THEN
    ALTER TABLE profiles ADD COLUMN community_listings_donated integer DEFAULT 0 CHECK (community_listings_donated >= 0);
  END IF;

  -- Daily Listings Used
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'daily_listings_used') THEN
    ALTER TABLE profiles ADD COLUMN daily_listings_used integer DEFAULT 0 CHECK (daily_listings_used >= 0);
  END IF;

  -- Last Listing Date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'last_listing_date') THEN
    ALTER TABLE profiles ADD COLUMN last_listing_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function: Get Community Pot Balance
CREATE OR REPLACE FUNCTION get_community_pot_balance()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance integer;
BEGIN
  SELECT (setting_value::text)::integer INTO balance
  FROM credit_system_settings
  WHERE setting_key = 'community_pot_balance';

  RETURN COALESCE(balance, 0);
END;
$$;

-- Function: Update Community Pot Balance
CREATE OR REPLACE FUNCTION update_community_pot_balance(delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE credit_system_settings
  SET setting_value = (COALESCE((setting_value::text)::integer, 0) + delta)::text,
      updated_at = now()
  WHERE setting_key = 'community_pot_balance'
  RETURNING (setting_value::text)::integer INTO new_balance;

  RETURN new_balance;
END;
$$;

-- Function: Process Donation
CREATE OR REPLACE FUNCTION process_donation(
  p_user_id uuid,
  p_amount numeric,
  p_donation_type text,
  p_stripe_payment_id text DEFAULT NULL,
  p_stripe_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits integer;
  v_cost_per_listing numeric;
  v_donation_id uuid;
  v_new_balance integer;
BEGIN
  -- Get cost per listing
  SELECT (setting_value::text)::numeric INTO v_cost_per_listing
  FROM credit_system_settings
  WHERE setting_key = 'cost_per_listing';

  -- Calculate credits
  v_credits := FLOOR(p_amount / v_cost_per_listing)::integer;

  -- Insert donation
  INSERT INTO donations (
    user_id,
    amount,
    donation_type,
    credits_granted,
    stripe_payment_id,
    stripe_session_id,
    status
  ) VALUES (
    p_user_id,
    p_amount,
    p_donation_type,
    v_credits,
    p_stripe_payment_id,
    p_stripe_session_id,
    'completed'
  ) RETURNING id INTO v_donation_id;

  -- Update based on donation type
  IF p_donation_type = 'community_pot' THEN
    -- Update community pot
    v_new_balance := update_community_pot_balance(v_credits);

    -- Log transaction
    INSERT INTO community_pot_transactions (
      transaction_type,
      user_id,
      amount,
      balance_after,
      description,
      donation_id
    ) VALUES (
      'donation',
      p_user_id,
      v_credits,
      v_new_balance,
      'Community donation of ' || p_amount || ' EUR',
      v_donation_id
    );

    -- Update user stats
    UPDATE profiles
    SET
      total_donated = total_donated + p_amount,
      community_listings_donated = community_listings_donated + v_credits,
      updated_at = now()
    WHERE id = p_user_id;

  ELSIF p_donation_type = 'personal_credits' THEN
    -- Update personal credits
    UPDATE profiles
    SET
      personal_credits = personal_credits + v_credits,
      total_donated = total_donated + p_amount,
      updated_at = now()
    WHERE id = p_user_id;
  END IF;

  RETURN v_donation_id;
END;
$$;

-- Function: Check Daily Reset
CREATE OR REPLACE FUNCTION check_daily_reset(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    daily_listings_used = 0,
    last_listing_date = CURRENT_DATE
  WHERE id = p_user_id
    AND last_listing_date < CURRENT_DATE;
END;
$$;

-- Function: Can Create Free Listing
CREATE OR REPLACE FUNCTION can_create_free_listing(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_limit integer;
  v_daily_used integer;
  v_pot_balance integer;
BEGIN
  -- Check daily reset first
  PERFORM check_daily_reset(p_user_id);

  -- Get settings
  SELECT (setting_value::text)::integer INTO v_daily_limit
  FROM credit_system_settings
  WHERE setting_key = 'daily_free_listings';

  -- Get user's daily usage
  SELECT daily_listings_used INTO v_daily_used
  FROM profiles
  WHERE id = p_user_id;

  -- Check if under daily limit
  IF v_daily_used >= v_daily_limit THEN
    RETURN false;
  END IF;

  -- Check community pot balance
  v_pot_balance := get_community_pot_balance();

  RETURN v_pot_balance > 0;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on donations
CREATE OR REPLACE FUNCTION update_donation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donations_update_timestamp
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_timestamp();

-- ============================================================================
-- 7. GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON credit_system_settings TO authenticated;
GRANT SELECT ON donations TO authenticated;
GRANT SELECT ON community_pot_transactions TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_community_pot_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_free_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_reset(uuid) TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Verification Queries (run manually to verify):
-- SELECT * FROM system_settings;
-- SELECT get_community_pot_balance();
-- SELECT can_create_free_listing(auth.uid());
