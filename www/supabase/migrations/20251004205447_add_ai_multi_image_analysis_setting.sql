/*
  # Add AI multi-image analysis setting

  1. Changes to profiles table
    - Add `ai_analyze_all_images` (boolean, default false) - Whether to analyze all images or just the primary one

  2. Notes
    - When false (default): Only the primary/first image is analyzed (faster, cheaper)
    - When true: All images are analyzed and results are merged (more detailed, higher cost)
    - Users will pay for API costs in the future, so they can choose quality vs cost
*/

-- Add AI multi-image analysis setting to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ai_analyze_all_images'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_analyze_all_images boolean DEFAULT false NOT NULL;
  END IF;
END $$;