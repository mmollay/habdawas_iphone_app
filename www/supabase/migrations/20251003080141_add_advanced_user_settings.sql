/*
  # Add Advanced User Settings and Pickup Addresses

  ## Overview
  Adds advanced user settings including pickup addresses, display preferences,
  and AI text generation preferences.

  ## New Table: `pickup_addresses`
  - `id` (uuid, primary key) - Unique address identifier
  - `user_id` (uuid) - References profiles(id)
  - `name` (text) - Address name/label (e.g., "Zuhause", "Büro")
  - `address` (text) - Street address
  - `postal_code` (text) - Postal code
  - `city` (text) - City name
  - `country` (text) - Country (default: 'Deutschland')
  - `phone` (text, nullable) - Contact phone for this address
  - `is_default` (boolean) - Whether this is the default address
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp

  ## Changes to `profiles` table
  
  ### Display Preferences
  - `show_phone_publicly` (boolean) - Show phone number on listings (default: false)
  - `default_pickup_address_id` (uuid, nullable) - References pickup_addresses(id)
  
  ### AI Text Generation Preferences
  - `ai_text_style` (text) - AI writing style (default: 'balanced')
    Options: 'formal', 'casual', 'detailed', 'concise', 'balanced'
  - `ai_text_length` (text) - Preferred text length (default: 'medium')
    Options: 'short', 'medium', 'long'
  - `ai_include_emoji` (boolean) - Include emojis in AI text (default: false)
  - `ai_auto_publish` (boolean) - Auto-publish after AI generation (default: false)

  ## Security
  - Enable RLS on pickup_addresses table
  - Users can only view, create, update, delete their own addresses

  ## Indexes
  - Index on user_id for faster address lookups
*/

-- Create pickup_addresses table
CREATE TABLE IF NOT EXISTS pickup_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  country text DEFAULT 'Deutschland',
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pickup_addresses ENABLE ROW LEVEL SECURITY;

-- Pickup addresses policies
CREATE POLICY "Users can view own pickup addresses"
  ON pickup_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pickup addresses"
  ON pickup_addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pickup addresses"
  ON pickup_addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pickup addresses"
  ON pickup_addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_pickup_addresses_user_id ON pickup_addresses(user_id);

-- Add columns to profiles table
DO $$
BEGIN
  -- Display Preferences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'show_phone_publicly'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_phone_publicly boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'default_pickup_address_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN default_pickup_address_id uuid REFERENCES pickup_addresses(id) ON DELETE SET NULL;
  END IF;

  -- AI Text Generation Preferences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ai_text_style'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_text_style text DEFAULT 'balanced';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ai_text_length'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_text_length text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ai_include_emoji'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_include_emoji boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ai_auto_publish'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_auto_publish boolean DEFAULT false;
  END IF;
END $$;

-- Trigger for pickup_addresses updated_at
CREATE TRIGGER update_pickup_addresses_updated_at
  BEFORE UPDATE ON pickup_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE pickup_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON pickup_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();