/*
  # Update Search Vector to Include All Product Fields

  ## Overview
  Updates the search_vector generation to include additional product fields like colors, size,
  features, and accessories. This ensures comprehensive search coverage.

  ## Changes Made

  ### 1. Updated Search Vector Function
  - **Added fields**: colors, size, weight, dimensions, features, accessories
  - **Proper handling**: Arrays are converted to searchable text
  - **Weight prioritization**: Important fields remain highly weighted

  ## Fields Now Included in Search
  - Title (weight A - highest priority)
  - Description (weight B)
  - Category, Subcategory, Brand (weight C)
  - Colors, Size, Features, Accessories (weight C)
  - Material, Style, Weight, Dimensions (weight D)
  - Tags (weight C)
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS items_search_vector_trigger ON items;

-- Update the search vector function to include all relevant fields
CREATE OR REPLACE FUNCTION items_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('german', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.subcategory, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(array_to_string(NEW.colors, ' '), '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.size, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(array_to_string(NEW.features, ' '), '')), 'C') ||
    setweight(to_tsvector('german', coalesce(array_to_string(NEW.accessories, ' '), '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.material, '')), 'D') ||
    setweight(to_tsvector('german', coalesce(NEW.style, '')), 'D') ||
    setweight(to_tsvector('german', coalesce(NEW.weight, '')), 'D') ||
    setweight(to_tsvector('german', coalesce(NEW.dimensions_length || ' ' || NEW.dimensions_width || ' ' || NEW.dimensions_height, '')), 'D') ||
    setweight(to_tsvector('german', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recreate trigger
CREATE TRIGGER items_search_vector_trigger 
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION items_search_vector_update();

-- Update all existing rows with the new search vector
UPDATE items SET search_vector = 
  setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('german', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('german', coalesce(subcategory, '')), 'C') ||
  setweight(to_tsvector('german', coalesce(brand, '')), 'C') ||
  setweight(to_tsvector('german', coalesce(array_to_string(colors, ' '), '')), 'C') ||
  setweight(to_tsvector('german', coalesce(size, '')), 'C') ||
  setweight(to_tsvector('german', coalesce(array_to_string(features, ' '), '')), 'C') ||
  setweight(to_tsvector('german', coalesce(array_to_string(accessories, ' '), '')), 'C') ||
  setweight(to_tsvector('german', coalesce(material, '')), 'D') ||
  setweight(to_tsvector('german', coalesce(style, '')), 'D') ||
  setweight(to_tsvector('german', coalesce(weight, '')), 'D') ||
  setweight(to_tsvector('german', coalesce(dimensions_length || ' ' || dimensions_width || ' ' || dimensions_height, '')), 'D') ||
  setweight(to_tsvector('german', coalesce(array_to_string(tags, ' '), '')), 'C');
