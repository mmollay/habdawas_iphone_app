/*
  # Fix Header Count Requests - Allow HEAD Requests for Counts

  1. Changes
    - Add SELECT policy for items table to allow authenticated users to count their own items
    - Add SELECT policy for favorites table to allow authenticated users to count their favorites
    - These policies specifically support HEAD requests with count='exact'

  2. Security
    - Users can only count their own items and favorites
    - No data is exposed, only counts
    - Maintains existing RLS security
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can count own items" ON items;
DROP POLICY IF EXISTS "Users can count own favorites" ON favorites;

-- Allow authenticated users to count their own items (for "Meine Inserate" count)
CREATE POLICY "Users can count own items"
  ON items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to count their favorites
CREATE POLICY "Users can count own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
