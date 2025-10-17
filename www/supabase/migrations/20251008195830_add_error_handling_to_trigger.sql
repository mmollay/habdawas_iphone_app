/*
  # Add Error Handling to handle_new_user Function

  1. Problem
    - Unklare Fehler bei der User-Erstellung
    - Kein Error-Logging

  2. Änderungen
    - Fügt EXCEPTION-Handler hinzu
    - Loggt Fehler für besseres Debugging
    - Gibt spezifischere Fehlermeldungen

  3. Sicherheit
    - Funktion hat SECURITY DEFINER, umgeht RLS
    - Nur bei User-Erstellung ausgeführt
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_error_message text;
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE WARNING 'Error inserting profile: %', v_error_message;
    RAISE;
  END;

  BEGIN
    INSERT INTO public.user_tokens (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE WARNING 'Error inserting user_tokens: %', v_error_message;
    RAISE;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Fatal error in handle_new_user: %', SQLERRM;
  RAISE;
END;
$$;
