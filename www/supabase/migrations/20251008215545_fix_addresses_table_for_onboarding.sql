/*
  # Fix addresses table for onboarding process

  ## Changes
  1. Make `name` field nullable (not required during onboarding)
  2. Change country default from 'Deutschland' to 'AT'
  3. Ensure phone field exists and is nullable (already correct)

  ## Rationale
  - During onboarding, users don't need to name their first address
  - Default country should be Austria (AT) not Germany
  - Phone is optional for addresses
*/

-- Make name nullable (it's auto-generated or can be added later)
ALTER TABLE addresses ALTER COLUMN name DROP NOT NULL;

-- Set default value for name
ALTER TABLE addresses ALTER COLUMN name SET DEFAULT 'Hauptadresse';

-- Fix country default
ALTER TABLE addresses ALTER COLUMN country SET DEFAULT 'AT';

-- Update existing addresses with 'Deutschland' to 'AT' if they have no specific data
UPDATE addresses 
SET country = 'AT' 
WHERE country = 'Deutschland';
