/*
  # Search Items with Attribute Filtering

  Creates an optimized function to search items with attribute-based filters.
  This allows frontend to filter items by vehicle attributes like brand, year, color, etc.
*/

-- Drop existing function if exists
DROP FUNCTION IF EXISTS search_items_with_attributes(UUID, JSONB);

-- Create function to search items with attribute filtering
CREATE OR REPLACE FUNCTION search_items_with_attributes(
  p_category_id UUID DEFAULT NULL,
  p_filters JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (item_id UUID) AS $$
DECLARE
  filter JSONB;
  filter_type TEXT;
  filter_attribute_id UUID;
  filter_value_text TEXT;
  filter_value_number NUMERIC;
  filter_value_array TEXT[];
  filter_value_range_min NUMERIC;
  filter_value_range_max NUMERIC;
  item_ids UUID[];
BEGIN
  -- Start with all items (or items in specified category)
  IF p_category_id IS NOT NULL THEN
    item_ids := ARRAY(
      SELECT id FROM items WHERE category_id = p_category_id
    );
  ELSE
    item_ids := ARRAY(
      SELECT id FROM items
    );
  END IF;

  -- Apply each filter
  FOR filter IN SELECT * FROM jsonb_array_elements(p_filters)
  LOOP
    filter_type := filter->>'type';
    filter_attribute_id := (filter->>'attributeId')::UUID;

    -- Handle different filter types
    CASE filter_type
      WHEN 'select' THEN
        filter_value_text := filter->>'value';
        item_ids := ARRAY(
          SELECT ia.item_id
          FROM item_attributes ia
          WHERE ia.item_id = ANY(item_ids)
            AND ia.attribute_id = filter_attribute_id
            AND ia.value_text = filter_value_text
        );

      WHEN 'multiselect' THEN
        -- Filter expects value as JSON array of strings
        filter_value_array := ARRAY(
          SELECT jsonb_array_elements_text(filter->'value')
        );
        item_ids := ARRAY(
          SELECT ia.item_id
          FROM item_attributes ia
          WHERE ia.item_id = ANY(item_ids)
            AND ia.attribute_id = filter_attribute_id
            AND ia.value_array && filter_value_array  -- Array overlap operator
        );

      WHEN 'range', 'year' THEN
        -- Value is [min, max] array
        filter_value_range_min := (filter->'value'->0)::TEXT::NUMERIC;
        filter_value_range_max := (filter->'value'->1)::TEXT::NUMERIC;
        item_ids := ARRAY(
          SELECT ia.item_id
          FROM item_attributes ia
          WHERE ia.item_id = ANY(item_ids)
            AND ia.attribute_id = filter_attribute_id
            AND ia.value_number >= filter_value_range_min
            AND ia.value_number <= filter_value_range_max
        );

      WHEN 'number' THEN
        filter_value_number := (filter->>'value')::NUMERIC;
        item_ids := ARRAY(
          SELECT ia.item_id
          FROM item_attributes ia
          WHERE ia.item_id = ANY(item_ids)
            AND ia.attribute_id = filter_attribute_id
            AND ia.value_number = filter_value_number
        );

      WHEN 'text' THEN
        filter_value_text := filter->>'value';
        item_ids := ARRAY(
          SELECT ia.item_id
          FROM item_attributes ia
          WHERE ia.item_id = ANY(item_ids)
            AND ia.attribute_id = filter_attribute_id
            AND ia.value_text ILIKE '%' || filter_value_text || '%'
        );

      WHEN 'boolean' THEN
        filter_value_text := filter->>'value';
        item_ids := ARRAY(
          SELECT ia.item_id
          FROM item_attributes ia
          WHERE ia.item_id = ANY(item_ids)
            AND ia.attribute_id = filter_attribute_id
            AND ia.value_boolean = (filter_value_text = 'true')
        );

      ELSE
        -- Unknown filter type, skip
        CONTINUE;
    END CASE;

    -- If no items match, return empty result
    IF array_length(item_ids, 1) IS NULL OR array_length(item_ids, 1) = 0 THEN
      RETURN;
    END IF;
  END LOOP;

  -- Return matching item IDs
  RETURN QUERY
  SELECT unnest(item_ids);
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_items_with_attributes TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION search_items_with_attributes IS 'Filters items by category and custom attributes. Returns matching item IDs.';
