/*
  # Rename pickup_addresses table to addresses

  This migration renames the pickup_addresses table to addresses since these addresses
  are used for both pickup (Abholung) and shipping (Versand) purposes.

  ## Changes
  1. Rename table from pickup_addresses to addresses
  2. All existing data, constraints, indexes, and RLS policies are preserved
  3. No data loss or structural changes

  ## Note
  Foreign key references in the items table will be automatically updated by PostgreSQL.
*/

-- Rename the table
ALTER TABLE IF EXISTS pickup_addresses RENAME TO addresses;
