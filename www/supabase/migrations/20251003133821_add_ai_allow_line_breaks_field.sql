/*
  # Add AI Line Breaks Setting

  1. Changes to profiles table
    - Add ai_allow_line_breaks (boolean) - Whether AI should use line breaks for structured text
    - Defaults to false (single paragraph text)

  2. Notes
    - When enabled, AI will structure descriptions with paragraphs for better readability
    - Improves text structure for longer descriptions
*/

-- Add ai_allow_line_breaks field to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ai_allow_line_breaks'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_allow_line_breaks boolean DEFAULT false;
  END IF;
END $$;
