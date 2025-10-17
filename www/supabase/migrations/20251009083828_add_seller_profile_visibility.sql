/*
  # Add Seller Profile Visibility Setting

  1. Changes
    - Add `show_seller_profile` column to profiles table
    - Default to `true` to encourage transparency and trust
    - Users can opt-out but will see a warning about reduced visibility

  2. Security
    - No RLS changes needed (existing policies cover this)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_seller_profile'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_seller_profile boolean DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN profiles.show_seller_profile IS 'Whether to show seller profile information on item listings. When enabled, increases trust and credibility.';