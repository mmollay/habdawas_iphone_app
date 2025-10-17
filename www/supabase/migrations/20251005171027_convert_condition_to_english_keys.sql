/*
  # Convert condition values to English keys for internationalization

  1. Changes
    - Updates all existing items to use English condition keys
    - Maps German values to English equivalents:
      - "neu" → "new"
      - "gebraucht - wie neu" → "like_new"
      - "gebraucht - gut" → "good"
      - "gebraucht - akzeptabel" → "acceptable"
      - "defekt" → "defective"
    - Updates the check constraint to only allow new English values

  2. Notes
    - This change prepares the database for future multilingual support
    - Frontend will handle translation of these keys to display language
    - All existing data is preserved with new English keys
*/

-- Drop the old constraint first
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_condition_check;

-- Update all existing items to use English condition keys
UPDATE items
SET condition = CASE condition
  WHEN 'neu' THEN 'new'
  WHEN 'gebraucht - wie neu' THEN 'like_new'
  WHEN 'gebraucht - gut' THEN 'good'
  WHEN 'gebraucht - akzeptabel' THEN 'acceptable'
  WHEN 'defekt' THEN 'defective'
  WHEN 'Sehr gut' THEN 'good'
  WHEN 'Gut' THEN 'good'
  ELSE 'good'
END;

-- Add new constraint with English values
ALTER TABLE items ADD CONSTRAINT items_condition_check
  CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'defective'));
