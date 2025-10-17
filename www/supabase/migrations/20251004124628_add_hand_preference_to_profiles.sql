/*
  # Add hand preference setting to profiles

  1. Changes
    - Add `hand_preference` column to `profiles` table
      - Type: text with check constraint ('left' or 'right')
      - Default: 'right' (most users are right-handed)
      - Used to optimize button placement for one-handed usage
  
  2. Notes
    - This improves accessibility and ergonomics
    - Affects navigation buttons, action buttons, and modal close buttons
    - Default is 'right' for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hand_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hand_preference text DEFAULT 'right' CHECK (hand_preference IN ('left', 'right'));
  END IF;
END $$;