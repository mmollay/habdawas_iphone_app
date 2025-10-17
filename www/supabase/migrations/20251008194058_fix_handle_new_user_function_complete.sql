/*
  # Fix handle_new_user Function

  1. Problem
    - Die Funktion fügt keinen Wert für ai_analyze_all_images ein
    - Diese Spalte ist NOT NULL und verursacht einen Fehler

  2. Änderungen
    - Vereinfacht die Funktion: verwendet nur noch die Spalten, die explizit gesetzt werden müssen
    - Lässt alle anderen Spalten ihre Default-Werte verwenden
    - Entfernt explizites created_at (hat bereits Default)

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
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
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
