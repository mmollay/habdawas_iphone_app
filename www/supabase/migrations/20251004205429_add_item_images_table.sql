/*
  # Create item_images table for multi-image support

  1. New Tables
    - `item_images`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key to items)
      - `image_url` (text, not null) - URL to the image in storage
      - `display_order` (integer, default 0) - Order for displaying images
      - `is_primary` (boolean, default false) - Whether this is the main/primary image
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `item_images` table
    - Anyone can view images for published items
    - Users can view images for their own items
    - Users can insert images for their own items
    - Users can update images for their own items
    - Users can delete images for their own items

  3. Indexes
    - Index on `item_id` for faster lookups
    - Index on `display_order` for faster ordering

  4. Notes
    - The existing `items.image_url` field will be kept for backwards compatibility
    - It will store the primary image URL (or first image if no primary is set)
    - Maximum 10 images per item enforced via constraint
*/

-- Create item_images table
CREATE TABLE IF NOT EXISTS item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_images_display_order ON item_images(item_id, display_order);
CREATE INDEX IF NOT EXISTS idx_item_images_primary ON item_images(item_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_images
CREATE POLICY "Anyone can view images for published items"
  ON item_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_images.item_id
      AND items.status = 'published'
    )
  );

CREATE POLICY "Public can view images for published items"
  ON item_images FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_images.item_id
      AND items.status = 'published'
    )
  );

CREATE POLICY "Users can view images for own items"
  ON item_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_images.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images for own items"
  ON item_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_images.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images for own items"
  ON item_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_images.item_id
      AND items.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_images.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images for own items"
  ON item_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_images.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_item_images_updated_at
  BEFORE UPDATE ON item_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to enforce only one primary image per item
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE item_images
    SET is_primary = false
    WHERE item_id = NEW.item_id
    AND id != NEW.id
    AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_primary_image
  BEFORE INSERT OR UPDATE ON item_images
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_image();

-- Function to limit maximum images per item
CREATE OR REPLACE FUNCTION check_max_images_per_item()
RETURNS TRIGGER AS $$
DECLARE
  image_count integer;
BEGIN
  SELECT COUNT(*) INTO image_count
  FROM item_images
  WHERE item_id = NEW.item_id;
  
  IF image_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per item allowed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_images_per_item
  BEFORE INSERT ON item_images
  FOR EACH ROW
  EXECUTE FUNCTION check_max_images_per_item();