-- Migration: Add Birth Data and Enhanced Notification Preferences
-- Description: Adds birth data fields for birthday features and enhanced notification settings
-- Created: 2025-10-21

-- Add birth data fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_time TIME,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS birth_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS birth_longitude DECIMAL(11, 8);

-- Add enhanced notification preferences
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notify_push_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_email_transactional BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_birthday_gift BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_birthday_gift_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN profiles.birth_date IS 'User birth date for birthday features and astrology';
COMMENT ON COLUMN profiles.birth_time IS 'User birth time for astrology calculations';
COMMENT ON COLUMN profiles.birth_place IS 'User birth place name';
COMMENT ON COLUMN profiles.birth_latitude IS 'Latitude of birth place for astrology';
COMMENT ON COLUMN profiles.birth_longitude IS 'Longitude of birth place for astrology';
COMMENT ON COLUMN profiles.notify_push_messages IS 'Receive push notifications for messages';
COMMENT ON COLUMN profiles.notify_email_transactional IS 'Receive transactional emails (order confirmations, etc.)';
COMMENT ON COLUMN profiles.notify_birthday_gift IS 'Receive birthday gift (credits)';
COMMENT ON COLUMN profiles.last_birthday_gift_at IS 'Last time user received birthday gift';

-- Note: Existing fields for notifications:
-- - notifications_enabled: General notification toggle
-- - email_notifications: Email notifications toggle
-- - newsletter_subscribed: Newsletter subscription (opt-in)
