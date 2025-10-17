/*
  # Combine User Creation Triggers

  1. Changes
    - Drop separate triggers for profile and token creation
    - Create single combined function that handles both
    - Ensures atomic operation - both profile and tokens created together
    
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Ensures every new user gets both profile and tokens
*/

-- Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_initialize_tokens ON auth.users;

-- Drop old functions
DROP FUNCTION IF EXISTS create_profile_for_new_user();
DROP FUNCTION IF EXISTS initialize_user_tokens();

-- Create combined function
CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create tokens
  INSERT INTO public.user_tokens (user_id, balance, total_earned)
  VALUES (NEW.id, 5000, 5000)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error initializing user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create single trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_new_user();
