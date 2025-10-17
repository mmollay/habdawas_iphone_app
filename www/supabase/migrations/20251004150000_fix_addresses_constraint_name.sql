/*
  # Fix addresses table constraint names

  This migration renames the foreign key constraint on the addresses table
  from the old pickup_addresses naming to the new addresses naming.

  ## Changes
  1. Rename constraint from pickup_addresses_user_id_fkey to addresses_user_id_fkey
*/

-- Rename the foreign key constraint
ALTER TABLE IF EXISTS addresses 
DROP CONSTRAINT IF EXISTS pickup_addresses_user_id_fkey;

ALTER TABLE IF EXISTS addresses 
ADD CONSTRAINT addresses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
