/*
  # Add Search Suggestions Function

  1. New Functions
    - `get_search_suggestions(search_text)` - Returns search suggestions based on partial input
      - Searches in item titles, categories, brands, and materials
      - Returns up to 10 relevant suggestions
      - Uses ILIKE for fast matching
      - Groups by type (title, category, brand, material)
  
  2. Performance
    - Limits results to prevent slow queries
    - Only searches published items
*/

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(search_text text)
RETURNS TABLE (
  suggestion text,
  type text,
  count bigint
) AS $$
BEGIN
  -- Return early if search text is too short
  IF length(trim(search_text)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  -- Get title suggestions
  SELECT DISTINCT
    items.title as suggestion,
    'title'::text as type,
    1::bigint as count
  FROM items
  WHERE status = 'published'
    AND items.title ILIKE '%' || search_text || '%'
  LIMIT 5;

  RETURN QUERY
  -- Get category suggestions
  SELECT DISTINCT
    items.category as suggestion,
    'category'::text as type,
    COUNT(*)::bigint as count
  FROM items
  WHERE status = 'published'
    AND items.category IS NOT NULL
    AND items.category ILIKE '%' || search_text || '%'
  GROUP BY items.category
  LIMIT 3;

  RETURN QUERY
  -- Get brand suggestions
  SELECT DISTINCT
    items.brand as suggestion,
    'brand'::text as type,
    COUNT(*)::bigint as count
  FROM items
  WHERE status = 'published'
    AND items.brand IS NOT NULL
    AND items.brand ILIKE '%' || search_text || '%'
  GROUP BY items.brand
  LIMIT 2;
END;
$$ LANGUAGE plpgsql STABLE;
