/*
  # Remove Admin Trigger Completely

  1. Changes
    - Drop all admin-related triggers that cause signup issues
    - Remove the trigger function
    - Admin status will be set manually via SQL or admin panel
    
  2. Security
    - This fixes the "Database error saving new user" issue
    - Admin status can still be managed through the admin panel
*/

-- Drop the trigger
DROP TRIGGER IF EXISTS set_admin_flag_after_insert_trigger ON profiles;
DROP TRIGGER IF EXISTS set_admin_flag_trigger ON profiles;

-- Drop the functions
DROP FUNCTION IF EXISTS set_admin_flag_after_insert();
DROP FUNCTION IF EXISTS set_admin_flag();
