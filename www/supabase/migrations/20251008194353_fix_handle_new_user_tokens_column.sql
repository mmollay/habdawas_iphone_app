/*
  # Fix handle_new_user Function - Correct Token Columns

  1. Problem
    - Die Funktion versucht in 'total_purchased' einzufügen, aber die Spalte heißt 'total_earned'
    - user_tokens Tabelle hat bereits Default-Werte für alle Spalten

  2. Änderungen
    - Korrigiert den Spaltennamen von total_purchased zu total_earned
    - Verwendet die Default-Werte der Tabelle (balance: 5000, total_earned: 5000, total_spent: 0)
    - Vereinfacht das Token-Insert

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
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_tokens (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
