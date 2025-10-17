/*
  # Add User Settings and Preferences to Profiles Table

  ## Overview
  Adds additional fields to the profiles table for user settings, preferences, and contact information.

  ## Changes to `profiles` table
  
  ### Contact Information
  - `phone` (text, nullable) - User phone number
  - `address` (text, nullable) - User street address
  - `postal_code` (text, nullable) - User postal code
  - `city` (text, nullable) - User city
  - `country` (text, nullable) - User country (default: 'Deutschland')
  
  ### User Preferences
  - `bio` (text, nullable) - User biography/about section
  - `language` (text, nullable) - Preferred language (default: 'de')
  - `notifications_enabled` (boolean) - Enable/disable notifications (default: true)
  - `email_notifications` (boolean) - Enable/disable email notifications (default: true)
  - `newsletter_subscribed` (boolean) - Newsletter subscription status (default: false)

  ## Notes
  - All new fields are nullable or have sensible defaults
  - No RLS policy changes needed as existing policies cover these fields
*/

DO $$
BEGIN
  -- Contact Information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text DEFAULT 'Deutschland';
  END IF;

  -- User Preferences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN language text DEFAULT 'de';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_notifications boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'newsletter_subscribed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN newsletter_subscribed boolean DEFAULT false;
  END IF;
END $$;