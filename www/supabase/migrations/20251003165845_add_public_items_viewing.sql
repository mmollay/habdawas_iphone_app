/*
  # Enable Public Viewing of Published Items

  1. Changes
    - Drop existing "Anyone can view published items" policy (restricted to authenticated only)
    - Create new policy that allows both authenticated and anonymous users to view published items
  
  2. Security
    - Anonymous users can only SELECT published items
    - All other operations (INSERT, UPDATE, DELETE) remain restricted to authenticated users
    - Users' own items viewing policy remains unchanged
*/

-- Drop the old policy that was restricted to authenticated users only
DROP POLICY IF EXISTS "Anyone can view published items" ON items;

-- Create new policy that allows public (anonymous + authenticated) to view published items
CREATE POLICY "Public can view published items"
  ON items FOR SELECT
  USING (status = 'published');