-- Migration: Add System Email Sender Settings
-- Description: Adds sender settings for system emails (auth, password reset, etc.)
-- Created: 2025-10-21

-- Add system email sender settings to newsletter_settings table
INSERT INTO newsletter_settings (setting_key, setting_value, description) VALUES
  ('system_email_from_name', '"HabDaWas"', 'Sender name for system emails (auth, password reset, etc.)'),
  ('system_email_from_email', '"auth@habdawas.at"', 'Sender email for system emails (auth, password reset, etc.)')
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment
COMMENT ON TABLE newsletter_settings IS 'Settings for newsletter and system email configuration';
