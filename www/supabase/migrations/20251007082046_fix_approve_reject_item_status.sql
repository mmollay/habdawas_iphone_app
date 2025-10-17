/*
  # Fix approve_item and reject_item functions status values

  1. Changes
    - Update approve_item to set status to 'published' instead of 'active'
    - Update reject_item to set status to 'archived' instead of 'inactive'
  
  2. Notes
    - The status constraint only allows: draft, published, paused, sold, archived, expired
    - 'active' and 'inactive' are not valid status values
*/

-- Fix approve_item function to use 'published' status
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
  SET status = 'published'
  WHERE id = item_id;
END;
$$;

-- Fix reject_item function to use 'archived' status
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
    status = 'archived',
    updated_at = now()
  WHERE id = item_id;
END;
$$;
