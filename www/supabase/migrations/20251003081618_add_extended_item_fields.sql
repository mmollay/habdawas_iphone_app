/*
  # Add Extended Item Fields for Product Details

  ## Overview
  Adds comprehensive product detail fields to the items table for storing
  AI-extracted information like brand, dimensions, materials, style, etc.

  ## Changes to `items` table
  
  ### Product Details
  - `brand` (text, nullable) - Product brand/manufacturer
  - `size` (text, nullable) - Size information
  - `weight` (text, nullable) - Product weight
  - `dimensions_length` (text, nullable) - Length dimension
  - `dimensions_width` (text, nullable) - Width dimension
  - `dimensions_height` (text, nullable) - Height dimension
  - `material` (text, nullable) - Material(s)
  - `colors` (text[], nullable) - Array of colors
  - `style` (text, nullable) - Style/design
  - `serial_number` (text, nullable) - Serial/model number
  - `features` (text[], nullable) - Array of features
  - `accessories` (text[], nullable) - Array of accessories
  - `tags` (text[], nullable) - Array of tags/keywords

  ## Notes
  - All new fields are nullable
  - Arrays are stored as PostgreSQL text arrays
  - No RLS changes needed as existing policies cover these fields
*/

DO $$
BEGIN
  -- Brand
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'brand'
  ) THEN
    ALTER TABLE items ADD COLUMN brand text;
  END IF;

  -- Size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'size'
  ) THEN
    ALTER TABLE items ADD COLUMN size text;
  END IF;

  -- Weight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'weight'
  ) THEN
    ALTER TABLE items ADD COLUMN weight text;
  END IF;

  -- Dimensions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'dimensions_length'
  ) THEN
    ALTER TABLE items ADD COLUMN dimensions_length text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'dimensions_width'
  ) THEN
    ALTER TABLE items ADD COLUMN dimensions_width text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'dimensions_height'
  ) THEN
    ALTER TABLE items ADD COLUMN dimensions_height text;
  END IF;

  -- Material
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'material'
  ) THEN
    ALTER TABLE items ADD COLUMN material text;
  END IF;

  -- Colors (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'colors'
  ) THEN
    ALTER TABLE items ADD COLUMN colors text[];
  END IF;

  -- Style
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'style'
  ) THEN
    ALTER TABLE items ADD COLUMN style text;
  END IF;

  -- Serial Number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'serial_number'
  ) THEN
    ALTER TABLE items ADD COLUMN serial_number text;
  END IF;

  -- Features (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'features'
  ) THEN
    ALTER TABLE items ADD COLUMN features text[];
  END IF;

  -- Accessories (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'accessories'
  ) THEN
    ALTER TABLE items ADD COLUMN accessories text[];
  END IF;

  -- Tags (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'tags'
  ) THEN
    ALTER TABLE items ADD COLUMN tags text[];
  END IF;
END $$;