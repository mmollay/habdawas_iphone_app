/*
  # Add Shipping Cost Type to Profiles

  ## Overview
  This migration adds a new field to control how shipping costs are determined.
  This makes it clear to users and buyers what type of shipping cost applies.

  ## Changes Made

  1. **Shipping Cost Type Field**
     - `shipping_cost_type` (text): Determines how shipping costs are calculated
     - Possible values: 'free', 'fixed', 'ai_calculated'
     - Default: 'fixed' (maintain backward compatibility)

  2. **Snapshot Field for Items**
     - `snapshot_shipping_cost_type` (text): Snapshot of shipping cost type at creation

  ## Use Cases

  - **free**: Kostenloser Versand - No shipping costs
  - **fixed**: Feste Versandkosten - User-defined fixed shipping cost
  - **ai_calculated**: KI-berechnete Versandkosten - AI calculates based on size/weight

  ## Benefits
  - Clear distinction between shipping cost types
  - No more confusion between free shipping and AI costs
  - Better user experience and transparency
*/

-- Add shipping_cost_type to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shipping_cost_type'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN shipping_cost_type text DEFAULT 'fixed' CHECK (shipping_cost_type IN ('free', 'fixed', 'ai_calculated'));
  END IF;
END $$;

-- Add snapshot_shipping_cost_type to items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'snapshot_shipping_cost_type'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN snapshot_shipping_cost_type text DEFAULT 'fixed' CHECK (snapshot_shipping_cost_type IN ('free', 'fixed', 'ai_calculated'));
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN profiles.shipping_cost_type IS 'Type of shipping cost: free (no cost), fixed (user-defined), ai_calculated (AI-based)';
COMMENT ON COLUMN items.snapshot_shipping_cost_type IS 'Snapshot: Type of shipping cost when item was created';