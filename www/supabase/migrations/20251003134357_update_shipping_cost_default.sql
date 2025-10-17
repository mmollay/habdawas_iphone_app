/*
  # Update Shipping Cost Default Value

  1. Changes
    - Change shipping_cost default from 0 to 5 EUR (more realistic default)
    
  2. Notes
    - 0 EUR shipping is unrealistic for most items
    - 5 EUR is a reasonable default for small packages
    - Existing rows with 0 will remain unchanged (user choice)
    - Only new profiles will get 5 EUR as default
*/

-- Update default value for shipping_cost
ALTER TABLE profiles 
  ALTER COLUMN shipping_cost SET DEFAULT 5;
