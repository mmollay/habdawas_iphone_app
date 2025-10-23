/*
  # Attribute Filter System - Replace Deep Category Hierarchies

  ## Problem
  - Level 3 categories are often redundant (e.g., "Autos > PKW")
  - Better UX: Shallow categories + dynamic filters (like Willhaben)
  - Example: Fahrzeuge > Autos, then filter by Marke, Leistung, Antriebe, Farbe, Baujahr

  ## Solution
  - Stop at Level 2 categories
  - Add attribute-based filtering system
  - Multilingual attribute names
  - Category-specific attribute sets
*/

-- =====================================================
-- 1. CATEGORY ATTRIBUTES (Define filters per category)
-- =====================================================
CREATE TABLE IF NOT EXISTS category_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

  -- Attribute identification
  attribute_key TEXT NOT NULL, -- 'brand', 'power_kw', 'fuel_type', 'color', 'year'
  attribute_type TEXT NOT NULL CHECK (attribute_type IN (
    'select',      -- Single selection dropdown
    'multiselect', -- Multiple selections
    'range',       -- Number range (e.g., 50-200 kW)
    'number',      -- Single number input
    'text',        -- Free text input
    'boolean',     -- Checkbox
    'date',        -- Date picker
    'year'         -- Year picker
  )),

  -- Multilingual labels
  translations JSONB NOT NULL, -- {"de": {"name": "Marke", "description": "..."}, "en": {...}, "fr": {...}}

  -- Validation & Options
  unit TEXT, -- 'kW', 'km', 'PS', etc.
  min_value NUMERIC, -- For range/number types
  max_value NUMERIC,
  step_value NUMERIC, -- For range sliders (e.g., step by 10)

  -- UI Configuration
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT true, -- Show in sidebar filters
  is_searchable BOOLEAN DEFAULT false, -- Include in search index
  show_in_list BOOLEAN DEFAULT false, -- Show in item list cards
  show_in_detail BOOLEAN DEFAULT true, -- Show in item detail page
  icon TEXT, -- Optional Material icon name

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(category_id, attribute_key)
);

CREATE INDEX idx_category_attributes_category ON category_attributes(category_id);
CREATE INDEX idx_category_attributes_filterable ON category_attributes(is_filterable) WHERE is_filterable = true;

-- =====================================================
-- 2. ATTRIBUTE OPTIONS (Predefined values for selects)
-- =====================================================
CREATE TABLE IF NOT EXISTS attribute_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES category_attributes(id) ON DELETE CASCADE,

  -- Option value
  option_key TEXT NOT NULL, -- 'vw', 'bmw', 'mercedes' (slug-like)

  -- Multilingual labels
  translations JSONB NOT NULL, -- {"de": {"name": "Volkswagen"}, "en": {"name": "Volkswagen"}, ...}

  -- Metadata
  icon TEXT, -- Optional icon URL or Material icon name
  color TEXT, -- For color attributes (hex code)

  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(attribute_id, option_key)
);

CREATE INDEX idx_attribute_options_attribute ON attribute_options(attribute_id);
CREATE INDEX idx_attribute_options_active ON attribute_options(is_active) WHERE is_active = true;

-- =====================================================
-- 3. ITEM ATTRIBUTES (Actual values for each item)
-- =====================================================
CREATE TABLE IF NOT EXISTS item_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES category_attributes(id) ON DELETE CASCADE,

  -- Flexible value storage
  value_text TEXT, -- For text, select (stores option_key)
  value_number NUMERIC, -- For number, range, year
  value_boolean BOOLEAN, -- For boolean
  value_date DATE, -- For date
  value_array TEXT[], -- For multiselect (stores option_keys)

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(item_id, attribute_id)
);

CREATE INDEX idx_item_attributes_item ON item_attributes(item_id);
CREATE INDEX idx_item_attributes_attribute ON item_attributes(attribute_id);
CREATE INDEX idx_item_attributes_value_text ON item_attributes(value_text) WHERE value_text IS NOT NULL;
CREATE INDEX idx_item_attributes_value_number ON item_attributes(value_number) WHERE value_number IS NOT NULL;
CREATE INDEX idx_item_attributes_value_array ON item_attributes USING GIN(value_array) WHERE value_array IS NOT NULL;

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Get all attributes for a specific category (including parent categories)
CREATE OR REPLACE FUNCTION get_category_attributes(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  attribute_key TEXT,
  attribute_type TEXT,
  translations JSONB,
  unit TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  step_value NUMERIC,
  is_required BOOLEAN,
  is_filterable BOOLEAN,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_path AS (
    -- Start with the given category
    SELECT c.id, c.parent_id, 0 AS depth
    FROM categories c
    WHERE c.id = p_category_id

    UNION ALL

    -- Get parent categories
    SELECT c.id, c.parent_id, cp.depth + 1
    FROM categories c
    INNER JOIN category_path cp ON c.id = cp.parent_id
    WHERE cp.parent_id IS NOT NULL
  )
  SELECT DISTINCT ON (ca.attribute_key)
    ca.id,
    ca.attribute_key,
    ca.attribute_type,
    ca.translations,
    ca.unit,
    ca.min_value,
    ca.max_value,
    ca.step_value,
    ca.is_required,
    ca.is_filterable,
    ca.sort_order
  FROM category_attributes ca
  INNER JOIN category_path cp ON ca.category_id = cp.id
  ORDER BY ca.attribute_key, cp.depth ASC, ca.sort_order ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get attribute options for a specific attribute
CREATE OR REPLACE FUNCTION get_attribute_options(p_attribute_id UUID)
RETURNS TABLE (
  id UUID,
  option_key TEXT,
  translations JSONB,
  icon TEXT,
  color TEXT,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ao.id,
    ao.option_key,
    ao.translations,
    ao.icon,
    ao.color,
    ao.sort_order
  FROM attribute_options ao
  WHERE ao.attribute_id = p_attribute_id
    AND ao.is_active = true
  ORDER BY ao.sort_order ASC, ao.option_key ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_attributes ENABLE ROW LEVEL SECURITY;

-- Everyone can read attributes and options
CREATE POLICY "Anyone can view category attributes"
  ON category_attributes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view attribute options"
  ON attribute_options FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view item attributes"
  ON item_attributes FOR SELECT
  USING (true);

-- Only authenticated users can create/update item attributes for their own items
CREATE POLICY "Users can insert item attributes for their items"
  ON item_attributes FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM items WHERE id = item_id
    )
  );

CREATE POLICY "Users can update item attributes for their items"
  ON item_attributes FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM items WHERE id = item_id
    )
  );

CREATE POLICY "Users can delete item attributes for their items"
  ON item_attributes FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM items WHERE id = item_id
    )
  );

-- Only admins can manage category_attributes and attribute_options
CREATE POLICY "Admins can manage category attributes"
  ON category_attributes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage attribute options"
  ON attribute_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- 6. UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_category_attributes_updated_at
  BEFORE UPDATE ON category_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_item_attributes_updated_at
  BEFORE UPDATE ON item_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON TABLE category_attributes IS 'Defines which attributes/filters are available for each category';
COMMENT ON TABLE attribute_options IS 'Predefined values for select/multiselect attributes';
COMMENT ON TABLE item_attributes IS 'Actual attribute values for each item';
COMMENT ON FUNCTION get_category_attributes IS 'Returns all attributes for a category including inherited from parents';
COMMENT ON FUNCTION get_attribute_options IS 'Returns all active options for a specific attribute';
