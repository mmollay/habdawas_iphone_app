/*
  # Fix Country Codes in Addresses

  1. Changes
    - Convert country names to country codes in addresses table
    - "Österreich" -> "AT"
    - "Deutschland" -> "DE"
    - "Schweiz" -> "CH"
    - Set NULL countries to "AT" (Austrian default)

  2. Notes
    - This fixes the mismatch between stored country names and the UI expecting codes
    - Ensures consistency with profiles table
*/

UPDATE addresses
SET country = CASE 
  WHEN country = 'Österreich' THEN 'AT'
  WHEN country = 'Deutschland' THEN 'DE'
  WHEN country = 'Schweiz' THEN 'CH'
  WHEN country IS NULL THEN 'AT'
  ELSE country
END
WHERE country IN ('Österreich', 'Deutschland', 'Schweiz') OR country IS NULL;
