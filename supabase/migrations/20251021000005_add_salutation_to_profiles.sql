-- Migration: Add Salutation Fields to Profiles
-- Description: Adds salutation fields for personalized email greetings
-- Created: 2025-10-21

-- Add salutation fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS salutation VARCHAR(20) DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS title VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN profiles.salutation IS 'Anredeform: neutral (Hallo), formal_mr (Sehr geehrter Herr), formal_ms (Sehr geehrte Frau), informal_m (Lieber), informal_f (Liebe)';
COMMENT ON COLUMN profiles.title IS 'Akademischer Titel (z.B. Dr., Prof., Mag.)';

-- Note: Salutation options:
-- - 'neutral': Hallo {{first_name}}
-- - 'formal_mr': Sehr geehrter Herr {{last_name}}
-- - 'formal_ms': Sehr geehrte Frau {{last_name}}
-- - 'informal_m': Lieber {{first_name}}
-- - 'informal_f': Liebe {{first_name}}
