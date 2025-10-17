/*
  # Token System

  1. New Tables
    - `user_tokens`
      - `user_id` (uuid, FK to auth.users, primary key)
      - `balance` (integer) - Current token balance
      - `total_earned` (integer) - Total tokens earned (purchases + bonuses)
      - `total_spent` (integer) - Total tokens spent on AI features
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `token_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `amount` (integer) - Positive for earning, negative for spending
      - `transaction_type` (text) - 'purchase', 'usage', 'bonus', 'refund'
      - `item_id` (uuid, FK to items, nullable) - Link to item if usage type
      - `gemini_input_tokens` (integer, nullable) - Gemini API input tokens
      - `gemini_output_tokens` (integer, nullable) - Gemini API output tokens
      - `gemini_total_tokens` (integer, nullable) - Total Gemini tokens used
      - `metadata` (jsonb, nullable) - Additional info (payment_id, description, etc.)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only read their own token data
    - Token transactions are insert-only (via functions)
    - Balance updates via triggers to ensure consistency

  3. Triggers
    - Auto-update user_tokens.updated_at on changes
    - Auto-update balance when transactions are inserted

  4. Functions
    - deduct_tokens(user_id, amount, item_id, gemini_stats) - Deduct tokens and create transaction
    - add_tokens(user_id, amount, type, metadata) - Add tokens (purchase/bonus)
*/

-- Create user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 5,
  total_earned integer NOT NULL DEFAULT 5,
  total_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'bonus', 'refund')),
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  gemini_input_tokens integer,
  gemini_output_tokens integer,
  gemini_total_tokens integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_item_id ON token_transactions(item_id);

-- Enable RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_tokens
CREATE POLICY "Users can view own token balance"
  ON user_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for token_transactions
CREATE POLICY "Users can view own token transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to initialize tokens for new users
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_tokens (user_id, balance, total_earned)
  VALUES (NEW.id, 5, 5)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize tokens when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_initialize_tokens ON auth.users;
CREATE TRIGGER on_auth_user_created_initialize_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_tokens();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS user_tokens_updated_at ON user_tokens;
CREATE TRIGGER user_tokens_updated_at
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tokens_updated_at();

-- Function to deduct tokens (for AI usage)
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id uuid,
  p_amount integer,
  p_item_id uuid DEFAULT NULL,
  p_gemini_input_tokens integer DEFAULT NULL,
  p_gemini_output_tokens integer DEFAULT NULL,
  p_gemini_total_tokens integer DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Get current balance with row lock
  SELECT balance INTO current_balance
  FROM user_tokens
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has enough tokens
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User token account not found';
  END IF;

  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Update balance and total_spent
  UPDATE user_tokens
  SET balance = balance - p_amount,
      total_spent = total_spent + p_amount
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO token_transactions (
    user_id,
    amount,
    transaction_type,
    item_id,
    gemini_input_tokens,
    gemini_output_tokens,
    gemini_total_tokens,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount,
    'usage',
    p_item_id,
    p_gemini_input_tokens,
    p_gemini_output_tokens,
    p_gemini_total_tokens,
    p_metadata
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add tokens (purchases, bonuses)
CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text DEFAULT 'purchase',
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('purchase', 'bonus', 'refund') THEN
    RAISE EXCEPTION 'Invalid transaction type for adding tokens';
  END IF;

  -- Update balance and total_earned
  UPDATE user_tokens
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO token_transactions (
    user_id,
    amount,
    transaction_type,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_metadata
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize tokens for existing users
INSERT INTO user_tokens (user_id, balance, total_earned)
SELECT id, 5, 5
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
