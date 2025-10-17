/*
  # Fix items status constraint

  1. Changes
    - Drop old status check constraint
    - Add new constraint with all valid status values: draft, published, paused, sold, archived, expired
  
  2. Notes
    - The old constraint only allowed: draft, published, sold
    - The new constraint matches the intended status values from the duration management migration
*/

-- Drop the old constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check;

-- Add the correct constraint with all status values
ALTER TABLE items ADD CONSTRAINT items_status_check 
  CHECK (status IN ('draft', 'published', 'paused', 'sold', 'archived', 'expired'));
