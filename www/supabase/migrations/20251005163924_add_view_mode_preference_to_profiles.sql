/*
  # Add view mode preference to profiles

  1. Changes
    - Add `view_mode_preference` column to profiles table
      - Type: text with check constraint for valid values
      - Default: 'grid'
      - Allowed values: 'grid', 'list', 'gallery'
  
  2. Security
    - No RLS changes needed (existing policies apply)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'view_mode_preference'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN view_mode_preference text DEFAULT 'grid' 
    CHECK (view_mode_preference IN ('grid', 'list', 'gallery'));
  END IF;
END $$;
