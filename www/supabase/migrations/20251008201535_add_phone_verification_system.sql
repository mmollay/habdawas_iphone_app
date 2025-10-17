/*
  # Add Phone Verification System

  1. New Tables
    - `phone_verification_codes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `phone` (text, the phone number being verified)
      - `code` (text, 6-digit verification code)
      - `expires_at` (timestamptz, expiration time)
      - `verified` (boolean, whether code was used)
      - `created_at` (timestamptz)
      
  2. Changes to profiles
    - Add `phone_verified` (boolean, default false)
    - Add `phone_verified_at` (timestamptz, nullable)
    
  3. Security
    - Enable RLS on `phone_verification_codes` table
    - Users can only see their own verification codes
    - Add function to generate and send verification codes
    - Add function to verify codes
    
  4. Functions
    - `request_phone_verification` - Generates code and returns it
    - `verify_phone_code` - Verifies the code and marks phone as verified
*/

-- Add phone verification fields to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- Create phone verification codes table
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification codes
CREATE POLICY "Users can view own verification codes"
  ON phone_verification_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create verification codes for themselves
CREATE POLICY "Users can create own verification codes"
  ON phone_verification_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification codes (mark as verified)
CREATE POLICY "Users can update own verification codes"
  ON phone_verification_codes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_user_id 
  ON phone_verification_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_expires_at 
  ON phone_verification_codes(expires_at);

-- Function to request phone verification
CREATE OR REPLACE FUNCTION request_phone_verification(p_phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_user_id uuid;
  v_existing_verified boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if phone is already verified
  SELECT phone_verified INTO v_existing_verified
  FROM profiles
  WHERE id = v_user_id;

  IF v_existing_verified AND EXISTS (
    SELECT 1 FROM profiles WHERE id = v_user_id AND phone = p_phone
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Phone already verified'
    );
  END IF;

  -- Generate 6-digit code
  v_code := LPAD(FLOOR(random() * 1000000)::text, 6, '0');

  -- Invalidate old codes for this user
  UPDATE phone_verification_codes
  SET verified = true
  WHERE user_id = v_user_id AND verified = false;

  -- Insert new verification code
  INSERT INTO phone_verification_codes (user_id, phone, code)
  VALUES (v_user_id, p_phone, v_code);

  -- Return the code (in production, this would trigger SMS sending)
  RETURN json_build_object(
    'success', true,
    'code', v_code,
    'message', 'Verification code generated'
  );
END;
$$;

-- Function to verify phone code
CREATE OR REPLACE FUNCTION verify_phone_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_phone text;
  v_record record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find valid verification code
  SELECT * INTO v_record
  FROM phone_verification_codes
  WHERE user_id = v_user_id
    AND code = p_code
    AND verified = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid or expired code'
    );
  END IF;

  -- Mark code as verified
  UPDATE phone_verification_codes
  SET verified = true
  WHERE id = v_record.id;

  -- Update profile
  UPDATE profiles
  SET 
    phone = v_record.phone,
    phone_verified = true,
    phone_verified_at = now()
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Phone verified successfully'
  );
END;
$$;

-- Function to check if user's phone is verified
CREATE OR REPLACE FUNCTION is_phone_verified(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(phone_verified, false)
  FROM profiles
  WHERE id = p_user_id;
$$;