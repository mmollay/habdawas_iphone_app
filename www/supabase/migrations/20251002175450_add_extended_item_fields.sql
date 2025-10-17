/*
  # Add Extended Product Fields to Items Table

  ## Overview
  Adds comprehensive product metadata fields to the items table to support detailed
  AI-generated product analysis including dimensions, materials, features, and more.

  ## Changes to `items` table
  
  ### Basic Product Information
  - `category` (text, nullable) - Main product category (e.g., "Elektronik", "Möbel")
  - `subcategory` (text, nullable) - Specific subcategory (e.g., "Smartphones", "Sofas")
  - `condition` (text, nullable) - Item condition (neu, gebraucht, etc.)
  - `brand` (text, nullable) - Brand/manufacturer name
  
  ### Physical Properties
  - `size` (text, nullable) - Size specification (e.g., "XL", "42", "2.5m")
  - `weight` (text, nullable) - Estimated weight (e.g., "500g", "2kg")
  - `dimensions_length` (text, nullable) - Length dimension
  - `dimensions_width` (text, nullable) - Width dimension
  - `dimensions_height` (text, nullable) - Height dimension
  - `material` (text, nullable) - Primary material(s)
  - `colors` (text[], nullable) - Array of colors
  
  ### Style and Features
  - `style` (text, nullable) - Design style (modern, classic, etc.)
  - `serial_number` (text, nullable) - Serial/model number if visible
  - `features` (text[], nullable) - Key features and specifications
  - `accessories` (text[], nullable) - Included accessories
  - `tags` (text[], nullable) - Search keywords and meta tags
  
  ## Notes
  - All new fields are nullable as they depend on AI detection
  - Arrays are used for colors, features, accessories, and tags for flexibility
  - No RLS policy changes needed as existing policies cover these fields
*/

-- Add extended product fields to items table
DO $$
BEGIN
  -- Basic product information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'category'
  ) THEN
    ALTER TABLE items ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE items ADD COLUMN subcategory text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'condition'
  ) THEN
    ALTER TABLE items ADD COLUMN condition text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'brand'
  ) THEN
    ALTER TABLE items ADD COLUMN brand text;
  END IF;

  -- Physical properties
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'size'
  ) THEN
    ALTER TABLE items ADD COLUMN size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'weight'
  ) THEN
    ALTER TABLE items ADD COLUMN weight text;
  END IF;

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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'material'
  ) THEN
    ALTER TABLE items ADD COLUMN material text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'colors'
  ) THEN
    ALTER TABLE items ADD COLUMN colors text[];
  END IF;

  -- Style and features
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'style'
  ) THEN
    ALTER TABLE items ADD COLUMN style text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'serial_number'
  ) THEN
    ALTER TABLE items ADD COLUMN serial_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'features'
  ) THEN
    ALTER TABLE items ADD COLUMN features text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'accessories'
  ) THEN
    ALTER TABLE items ADD COLUMN accessories text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'tags'
  ) THEN
    ALTER TABLE items ADD COLUMN tags text[];
  END IF;
END $$;