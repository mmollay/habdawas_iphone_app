/*
  # Fix Item Views Cascade Delete

  Problem:
  - When deleting a user, their item_views were set to NULL due to ON DELETE SET NULL
  - This violates the unique constraint "unique_user_view" because multiple NULL entries are created
  - Error: "duplicate key value violates unique constraint 'unique_user_view'"

  Solution:
  - Change foreign key constraint from ON DELETE SET NULL to ON DELETE CASCADE
  - This ensures that when a user is deleted, their views are also deleted
*/

-- Drop the existing foreign key constraint
ALTER TABLE item_views
  DROP CONSTRAINT IF EXISTS item_views_viewer_id_fkey;

-- Add new foreign key constraint with CASCADE delete
ALTER TABLE item_views
  ADD CONSTRAINT item_views_viewer_id_fkey
  FOREIGN KEY (viewer_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Also ensure items cascade properly
ALTER TABLE item_views
  DROP CONSTRAINT IF EXISTS item_views_item_id_fkey;

ALTER TABLE item_views
  ADD CONSTRAINT item_views_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE CASCADE;
