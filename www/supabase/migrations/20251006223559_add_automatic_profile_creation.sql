/*
  # Add Automatic Profile Creation

  1. Changes
    - Create function to automatically create a profile when a user signs up
    - Create trigger on auth.users table AFTER INSERT
    - Copies email from auth.users to profiles table
    
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Ensures every new user gets a profile automatically
*/

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();
