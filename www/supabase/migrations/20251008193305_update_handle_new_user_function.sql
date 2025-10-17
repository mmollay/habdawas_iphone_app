/*
  # Update handle_new_user Function

  1. Problem
    - Der full_name wird nicht aus den User-Metadaten übernommen
    - Das Profil wird ohne Namen erstellt

  2. Änderungen
    - Aktualisiert handle_new_user() um full_name aus user_metadata zu übernehmen
    - Setzt full_name beim Profil-Erstellen

  3. Sicherheit
    - Funktion hat SECURITY DEFINER, umgeht RLS
    - Nur bei User-Erstellung ausgeführt
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

  INSERT INTO public.user_tokens (user_id, balance, total_purchased, total_spent)
  VALUES (NEW.id, 10, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
