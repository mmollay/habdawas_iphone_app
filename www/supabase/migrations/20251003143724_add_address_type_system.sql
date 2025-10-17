/*
  # Add Address Type System for Pickup and Shipping

  ## Changes Made
  
  1. **Address Type Field**
     - Added `address_type` column to `pickup_addresses` table
     - Possible values: 'pickup_only', 'shipping_only', 'both'
     - Default: 'both' (address can be used for pickup and shipping)
  
  2. **Default Shipping Address**
     - Added `is_default_shipping` column
     - Allows separate default for shipping vs general pickup
     - Default: false
  
  3. **Rationale**
     - Different countries have different shipping costs (e.g., Austria vs Germany)
     - AI needs to know the shipping origin country for accurate cost calculation
     - Users may have separate pickup and shipping locations
     - One address can serve both purposes or just one
  
  ## Use Cases
  
  - User in Austria: Sets address as 'both' → can ship from Austria AND offer local pickup
  - User with warehouse: One address for 'shipping_only', another for 'pickup_only'
  - User preference: Mark default shipping address different from default pickup
*/

-- Add address_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pickup_addresses' AND column_name = 'address_type'
  ) THEN
    ALTER TABLE pickup_addresses 
    ADD COLUMN address_type text DEFAULT 'both' CHECK (address_type IN ('pickup_only', 'shipping_only', 'both'));
  END IF;
END $$;

-- Add is_default_shipping column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pickup_addresses' AND column_name = 'is_default_shipping'
  ) THEN
    ALTER TABLE pickup_addresses 
    ADD COLUMN is_default_shipping boolean DEFAULT false;
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN pickup_addresses.address_type IS 'Type of address usage: pickup_only (only for pickup), shipping_only (only for shipping), both (can be used for both)';
COMMENT ON COLUMN pickup_addresses.is_default_shipping IS 'Whether this is the default shipping address (separate from is_default for pickup)';

-- Create index for faster queries on default shipping address
CREATE INDEX IF NOT EXISTS idx_pickup_addresses_default_shipping 
ON pickup_addresses(user_id, is_default_shipping) 
WHERE is_default_shipping = true;