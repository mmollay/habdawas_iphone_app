/*
  # Update Token System and Add Deduct Function

  1. Changes
    - Update token system modes: 'free_monthly' (10 listings/month), 'paid' (buy tokens), 'donation'
    - Create deduct_tokens function to properly track token usage
    - Create token_transactions table for detailed tracking
    - Update initial token balance to 10 tokens (free monthly allowance)

  2. New Tables
    - `token_transactions`
      - Transaction history for all token changes
      - Tracks AI usage details (Gemini tokens, etc.)

  3. Security
    - Enable RLS on token_transactions
    - Only users can view their own transactions
    - Admin can view all transactions
*/

-- Drop old constraint
ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_token_system_mode_check;

-- Update existing data first
UPDATE system_settings
SET token_system_mode = 'free_monthly'
WHERE token_system_mode NOT IN ('free_monthly', 'paid', 'donation');

-- Add new constraint
ALTER TABLE system_settings
ADD CONSTRAINT system_settings_token_system_mode_check 
CHECK (token_system_mode IN ('free_monthly', 'paid', 'donation'));

-- Update system settings defaults
UPDATE system_settings
SET 
  default_token_package = 10,
  platform_message = 'Sie erhalten jeden Monat 10 kostenlose Inserate! Für mehr Inserate können Sie jederzeit Token nachkaufen oder uns mit einer Spende unterstützen.'
WHERE id IS NOT NULL;

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund', 'admin_adjustment')),
  reason text,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  gemini_input_tokens integer,
  gemini_output_tokens integer,
  gemini_total_tokens integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_token_transactions_item_id ON token_transactions(item_id);

-- Enable RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_current_user_admin());

DROP POLICY IF EXISTS "Admin can manage all transactions" ON token_transactions;
CREATE POLICY "Admin can manage all transactions"
  ON token_transactions FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Drop and recreate deduct_tokens function
DROP FUNCTION IF EXISTS deduct_tokens(uuid, integer, uuid, integer, integer, integer, jsonb);

CREATE FUNCTION deduct_tokens(
  p_user_id uuid,
  p_amount integer,
  p_item_id uuid DEFAULT NULL,
  p_gemini_input_tokens integer DEFAULT NULL,
  p_gemini_output_tokens integer DEFAULT NULL,
  p_gemini_total_tokens integer DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_tokens
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User token record not found';
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient token balance. Current: %, Required: %', v_current_balance, p_amount;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  UPDATE user_tokens
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO token_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reason,
    item_id,
    gemini_input_tokens,
    gemini_output_tokens,
    gemini_total_tokens,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount,
    v_new_balance,
    'debit',
    'AI image analysis',
    p_item_id,
    p_gemini_input_tokens,
    p_gemini_output_tokens,
    p_gemini_total_tokens,
    p_metadata
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'amount_deducted', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- Create credit_tokens function (for purchases/refunds)
DROP FUNCTION IF EXISTS credit_tokens(uuid, integer, text, text, jsonb);

CREATE FUNCTION credit_tokens(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text DEFAULT 'credit',
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_tokens
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User token record not found';
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Update balance
  UPDATE user_tokens
  SET 
    balance = v_new_balance,
    total_purchased = total_purchased + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO token_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    v_new_balance,
    p_transaction_type,
    p_reason,
    p_metadata
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'amount_credited', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- Update initial token balance for new users to 10 (monthly allowance)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_tokens (user_id, balance, total_purchased, total_spent)
  VALUES (NEW.id, 10, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
