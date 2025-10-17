/*
  # Add Full-Text Search Optimization

  ## Overview
  Adds PostgreSQL Full-Text Search (FTS) indexes to the items table to dramatically 
  improve search performance for text queries across multiple fields.

  ## Changes Made

  ### 1. Full-Text Search Column
  - **search_vector column**: Stores combined searchable text as tsvector
  - **Automatic updates**: Function and trigger maintain the search vector
  - **Language support**: Uses German text search configuration for better word stemming

  ### 2. Trigram Indexes for Fuzzy Matching
  - **pg_trgm extension**: Enables fuzzy text matching and similarity searches
  - **Trigram indexes**: Added to frequently searched fields (title, description, brand)
  - **Benefits**: Finds results even with typos, partial matches, and similar words

  ### 3. Category and Filter Indexes
  - **Category indexes**: Fast filtering by category/subcategory
  - **Composite indexes**: Optimized for common query patterns

  ## Performance Impact
  - Text searches will be 10-100x faster on large datasets
  - Supports complex multi-word queries efficiently
  - Small overhead on INSERT/UPDATE operations (negligible for user experience)

  ## Search Capabilities After This Migration
  - Fast full-text search across all text fields
  - Fuzzy matching for typo tolerance
  - Ranked search results by relevance
  - Efficient multi-term queries (e.g., "Fahrrad Kind")
*/

-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a tsvector column for full-text search
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION items_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('german', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.subcategory, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.material, '')), 'D') ||
    setweight(to_tsvector('german', coalesce(NEW.style, '')), 'D') ||
    setweight(to_tsvector('german', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS items_search_vector_trigger ON items;
CREATE TRIGGER items_search_vector_trigger 
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION items_search_vector_update();

-- Update existing rows with search vector
UPDATE items SET search_vector = 
  setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('german', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('german', coalesce(subcategory, '')), 'C') ||
  setweight(to_tsvector('german', coalesce(brand, '')), 'C') ||
  setweight(to_tsvector('german', coalesce(material, '')), 'D') ||
  setweight(to_tsvector('german', coalesce(style, '')), 'D') ||
  setweight(to_tsvector('german', coalesce(array_to_string(tags, ' '), '')), 'C')
WHERE search_vector IS NULL;

-- Create GIN index on the search vector for fast full-text search
CREATE INDEX IF NOT EXISTS idx_items_search_vector 
ON items USING GIN (search_vector);

-- Create trigram indexes for fuzzy matching on key fields
CREATE INDEX IF NOT EXISTS idx_items_title_trgm 
ON items USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_items_description_trgm 
ON items USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_items_brand_trgm 
ON items USING GIN (brand gin_trgm_ops);

-- Create standard B-tree indexes for exact category/filter matching
CREATE INDEX IF NOT EXISTS idx_items_category 
ON items(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_subcategory 
ON items(subcategory) WHERE subcategory IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_created_at 
ON items(created_at DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_items_status_created 
ON items(status, created_at DESC);
