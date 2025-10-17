/*
  # Add Shipping Snapshot Fields to Items Table

  ## Overview
  This migration adds snapshot fields to the items table that capture shipping settings
  at the time of item creation. This ensures items remain unchanged even if the seller
  modifies their global shipping settings later.

  ## Changes Made

  1. **Address Reference**
     - `selected_address_id` (uuid): Reference to pickup_addresses table
     - Links item to the specific address it will be shipped/picked up from

  2. **Shipping Origin**
     - `shipping_from_country` (text): Country code (e.g., 'AT', 'DE')
     - Used by AI to calculate accurate country-specific shipping costs

  3. **Shipping Settings Snapshot**
     - `snapshot_shipping_enabled` (boolean): Whether shipping was enabled at creation
     - `snapshot_shipping_cost` (numeric): Seller's fixed shipping cost at creation
     - `snapshot_pickup_enabled` (boolean): Whether pickup was enabled at creation
     - `snapshot_show_location_publicly` (boolean): Location visibility at creation

  4. **Pickup Location Snapshot**
     - `snapshot_pickup_address` (text): Full address for pickup
     - `snapshot_pickup_postal_code` (text): Postal code for pickup
     - `snapshot_pickup_city` (text): City for pickup
     - `snapshot_pickup_country` (text): Country for pickup
     - `snapshot_location_description` (text): Custom location description

  ## Benefits
  - **Immutability**: Items remain unchanged when seller updates settings
  - **Consistency**: Buyers see the same conditions over time
  - **Accuracy**: AI calculates shipping based on actual origin country
  - **Independence**: Items don't break if addresses are deleted
*/

-- Add selected_address_id reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'selected_address_id'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN selected_address_id uuid REFERENCES pickup_addresses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add shipping_from_country
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'shipping_from_country'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN shipping_from_country text;
  END IF;
END $$;

-- Add snapshot_shipping_enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_shipping_enabled'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_shipping_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add snapshot_shipping_cost
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_shipping_cost'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_shipping_cost numeric DEFAULT 0;
  END IF;
END $$;

-- Add snapshot_pickup_enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_pickup_enabled'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_pickup_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add snapshot_show_location_publicly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_show_location_publicly'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_show_location_publicly boolean DEFAULT false;
  END IF;
END $$;

-- Add snapshot_pickup_address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_pickup_address'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_pickup_address text;
  END IF;
END $$;

-- Add snapshot_pickup_postal_code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_pickup_postal_code'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_pickup_postal_code text;
  END IF;
END $$;

-- Add snapshot_pickup_city
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_pickup_city'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_pickup_city text;
  END IF;
END $$;

-- Add snapshot_pickup_country
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_pickup_country'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_pickup_country text;
  END IF;
END $$;

-- Add snapshot_location_description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_location_description'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_location_description text;
  END IF;
END $$;

-- Add snapshot_shipping_description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_shipping_description'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_shipping_description text;
  END IF;
END $$;

-- Create index for faster queries by address
CREATE INDEX IF NOT EXISTS idx_items_selected_address 
ON items(selected_address_id) 
WHERE selected_address_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN items.selected_address_id IS 'Reference to the pickup_addresses table - the address selected when creating this item';
COMMENT ON COLUMN items.shipping_from_country IS 'Country code (e.g., AT, DE) for AI shipping cost calculation';
COMMENT ON COLUMN items.snapshot_shipping_enabled IS 'Snapshot: Whether shipping was enabled when item was created';
COMMENT ON COLUMN items.snapshot_shipping_cost IS 'Snapshot: Sellers fixed shipping cost when item was created';
COMMENT ON COLUMN items.snapshot_pickup_enabled IS 'Snapshot: Whether pickup was enabled when item was created';
COMMENT ON COLUMN items.snapshot_show_location_publicly IS 'Snapshot: Whether location was shown publicly when item was created';
COMMENT ON COLUMN items.snapshot_pickup_address IS 'Snapshot: Full pickup address when item was created';
COMMENT ON COLUMN items.snapshot_pickup_postal_code IS 'Snapshot: Pickup postal code when item was created';
COMMENT ON COLUMN items.snapshot_pickup_city IS 'Snapshot: Pickup city when item was created';
COMMENT ON COLUMN items.snapshot_pickup_country IS 'Snapshot: Pickup country when item was created';
COMMENT ON COLUMN items.snapshot_location_description IS 'Snapshot: Custom location description when item was created';
COMMENT ON COLUMN items.snapshot_shipping_description IS 'Snapshot: Custom shipping description when item was created';