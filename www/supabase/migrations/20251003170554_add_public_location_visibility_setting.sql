/*
  # Add Public Location Visibility Setting

  1. New Column
    - Add `show_location_to_public` (boolean) to profiles table
    - Controls whether city/country is visible to non-authenticated users
    - Defaults to true (public can see city/country)
    - Different from `show_location_publicly` which controls full address visibility to authenticated users
  
  2. Privacy Levels
    - `show_location_to_public = false`: Only authenticated users see city/country
    - `show_location_to_public = true`: Everyone sees city/country (default)
    - `show_location_publicly = false`: Only city/postal shown to authenticated users
    - `show_location_publicly = true`: Full address shown to authenticated users
  
  3. Security
    - No RLS changes needed
    - Frontend will check user authentication status and these flags
*/

-- Add column to control location visibility to public (non-authenticated users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_location_to_public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_location_to_public boolean DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN profiles.show_location_to_public IS 'Whether to show city/country to non-authenticated (public) users. Default true.';