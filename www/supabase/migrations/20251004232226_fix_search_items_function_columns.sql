/*
  # Fix search_items Function Column References

  ## Overview
  Updates the search_items function to only reference columns that actually exist in the items table.
  Removes references to non-existent columns like 'country' and 'shipping_included'.

  ## Changes Made
  - Simplified the function to return only id column
  - The frontend will fetch the full item details using the returned IDs
  - This approach is more maintainable and avoids column mismatch issues
*/

-- Drop and recreate the search function with correct columns
DROP FUNCTION IF EXISTS search_items(text);

CREATE OR REPLACE FUNCTION search_items(search_query text)
RETURNS TABLE (id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT items.id
  FROM items
  WHERE items.search_vector @@ to_tsquery('german', search_query)
  ORDER BY ts_rank(items.search_vector, to_tsquery('german', search_query)) DESC;
END;
$$;
