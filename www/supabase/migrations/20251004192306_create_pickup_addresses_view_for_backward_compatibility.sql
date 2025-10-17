/*
  # Create backward compatibility view for pickup_addresses

  This migration creates a view named pickup_addresses that points to the addresses table.
  This ensures backward compatibility with any cached API schemas.

  ## Changes
  1. Create a view pickup_addresses that mirrors the addresses table
  2. This allows both names to work during the transition period
*/

-- Create a view with the old name for backward compatibility
CREATE OR REPLACE VIEW pickup_addresses AS 
SELECT * FROM addresses;

-- Grant the same permissions as the addresses table
GRANT ALL ON pickup_addresses TO authenticated;
GRANT ALL ON pickup_addresses TO service_role;

-- Enable RLS on the view (inherited from base table)
ALTER VIEW pickup_addresses SET (security_invoker = true);
