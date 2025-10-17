/*
  # Update Item Policies for Permission System

  1. Changes
    - Update item policies to use permission checks
    - Allow users with 'items.approve' permission to approve items
    - Allow users with 'items.reject' permission to reject/hide items
    - Allow users with 'items.delete' permission to delete any item
    - Allow users with 'items.edit_any' permission to edit any item
    - Allow users with 'items.view_all' permission to view all items

  2. Security
    - Maintain existing user ownership checks
    - Add permission-based checks for moderators
    - Super admin retains all permissions
*/

-- Drop existing policies that will be replaced
DROP POLICY IF EXISTS "Admin can update any item" ON items;
DROP POLICY IF EXISTS "Users can view published items or own items" ON items;

-- Users can view published items, own items, or if they have view_all permission
CREATE POLICY "Users can view published items or own items or with permission"
  ON items FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR user_id = auth.uid()
    OR current_user_has_permission('items.view_all')
  );

-- Public users can only view active items
CREATE POLICY "Public users can view active items"
  ON items FOR SELECT
  TO anon
  USING (status = 'active');

-- Users with edit_any permission can update any item
CREATE POLICY "Users with edit permission can update any item"
  ON items FOR UPDATE
  TO authenticated
  USING (
    current_user_has_permission('items.edit_any')
  )
  WITH CHECK (
    current_user_has_permission('items.edit_any')
  );

-- Users with delete permission can delete any item
CREATE POLICY "Users with delete permission can delete any item"
  ON items FOR DELETE
  TO authenticated
  USING (
    current_user_has_permission('items.delete')
  );

-- Create function to approve item (for moderators)
CREATE OR REPLACE FUNCTION approve_item(item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT current_user_has_permission('items.approve') THEN
    RAISE EXCEPTION 'Access denied. Approval permission required.';
  END IF;

  UPDATE items
  SET status = 'active'
  WHERE id = item_id;
END;
$$;

-- Create function to reject/hide item (for moderators)
CREATE OR REPLACE FUNCTION reject_item(item_id uuid, reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT current_user_has_permission('items.reject') THEN
    RAISE EXCEPTION 'Access denied. Rejection permission required.';
  END IF;

  UPDATE items
  SET 
    status = 'inactive',
    notes = CASE 
      WHEN reason IS NOT NULL THEN COALESCE(notes || E'\n\n', '') || 'Abgelehnt: ' || reason
      ELSE notes
    END
  WHERE id = item_id;
END;
$$;

-- Create function to feature item (for moderators)
CREATE OR REPLACE FUNCTION feature_item(item_id uuid, featured boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT current_user_has_permission('items.feature') THEN
    RAISE EXCEPTION 'Access denied. Feature permission required.';
  END IF;

  -- Note: Add a 'featured' column to items table if needed
  -- For now, this is a placeholder function
  RAISE NOTICE 'Feature flag set to % for item %', featured, item_id;
END;
$$;
