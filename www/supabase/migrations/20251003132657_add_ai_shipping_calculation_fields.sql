/*
  # Add AI Shipping Cost Calculation Fields

  1. Changes to items table
    - Add ai_shipping_domestic (numeric) - AI-calculated domestic shipping cost
    - Add ai_shipping_international (numeric) - AI-calculated international shipping cost
    - Add estimated_weight_kg (numeric) - AI-estimated weight in kilograms
    - Add package_dimensions (jsonb) - AI-estimated dimensions {length, width, height} in cm

  2. Changes to profiles table
    - Add show_ai_shipping_costs (boolean) - Toggle to show/hide AI shipping calculations
    - Defaults to true (show AI calculations)

  3. Notes
    - AI will calculate shipping based on size and weight
    - Users can choose whether to display these AI calculations
    - Dimensions stored as JSON for flexibility: {"length": 30, "width": 20, "height": 10}
*/

-- Add AI shipping calculation fields to items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'ai_shipping_domestic'
  ) THEN
    ALTER TABLE items ADD COLUMN ai_shipping_domestic numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'ai_shipping_international'
  ) THEN
    ALTER TABLE items ADD COLUMN ai_shipping_international numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'estimated_weight_kg'
  ) THEN
    ALTER TABLE items ADD COLUMN estimated_weight_kg numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'package_dimensions'
  ) THEN
    ALTER TABLE items ADD COLUMN package_dimensions jsonb;
  END IF;
END $$;

-- Add show AI shipping toggle to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_ai_shipping_costs'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_ai_shipping_costs boolean DEFAULT true;
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN items.package_dimensions IS 'AI-estimated package dimensions in cm stored as JSON: {"length": 30, "width": 20, "height": 10}';
