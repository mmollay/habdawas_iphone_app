/*
  # Add search_items RPC function

  ## Overview
  Creates a PostgreSQL function to perform full-text search on items using the search_vector column.
  This function uses the German text search configuration for proper word stemming.

  ## Changes Made

  ### 1. search_items Function
  - **Purpose**: Performs full-text search with proper German language support
  - **Parameters**: search_query (text) - The search terms to find
  - **Returns**: All matching items ordered by relevance
  - **Security**: Uses security definer to ensure proper RLS application

  ## How It Works
  - Converts the search query to a tsquery using German configuration
  - Searches the search_vector column using the @@ operator
  - Orders results by relevance (ts_rank)
  - Returns all matching items with all columns
*/

-- Create the search function
CREATE OR REPLACE FUNCTION search_items(search_query text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  price numeric,
  category text,
  subcategory text,
  condition text,
  image_url text,
  brand text,
  material text,
  style text,
  tags text[],
  postal_code text,
  location text,
  country text,
  shipping_included boolean,
  shipping_cost numeric,
  shipping_cost_type text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  duration_days integer,
  expires_at timestamptz,
  search_vector tsvector
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    items.id,
    items.user_id,
    items.title,
    items.description,
    items.price,
    items.category,
    items.subcategory,
    items.condition,
    items.image_url,
    items.brand,
    items.material,
    items.style,
    items.tags,
    items.postal_code,
    items.location,
    items.country,
    items.shipping_included,
    items.shipping_cost,
    items.shipping_cost_type,
    items.status,
    items.created_at,
    items.updated_at,
    items.duration_days,
    items.expires_at,
    items.search_vector
  FROM items
  WHERE items.search_vector @@ to_tsquery('german', search_query)
  ORDER BY ts_rank(items.search_vector, to_tsquery('german', search_query)) DESC;
END;
$$;
