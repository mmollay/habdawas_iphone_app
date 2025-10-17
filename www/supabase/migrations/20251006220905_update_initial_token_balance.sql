/*
  # Update Initial Token Balance

  1. Changes
    - Update default token balance for new users from 5 to 5000
    - Update initialization function to give 5000 tokens instead of 5
    - Update existing users with 5 tokens to 5000 tokens (one-time upgrade)
  
  2. Rationale
    - New consumption-based system: 1 token = 1 Gemini token
    - Average listing uses ~2500 tokens
    - 5000 tokens = ~2 free listings for new users
    - More generous than before, encourages platform adoption
*/

-- Update the default balance in user_tokens table
ALTER TABLE user_tokens 
ALTER COLUMN balance SET DEFAULT 5000,
ALTER COLUMN total_earned SET DEFAULT 5000;

-- Update the initialization function
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_tokens (user_id, balance, total_earned)
  VALUES (NEW.id, 5000, 5000)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upgrade existing users who only have the old 5 token balance
UPDATE user_tokens
SET balance = 5000,
    total_earned = 5000
WHERE balance = 5 AND total_spent = 0;
