/*
  # Fix Profile Creation Trigger

  1. Problem
    - Die Funktion `handle_new_user()` existiert, aber der Trigger wurde nie erstellt
    - Dadurch können neue User keine Profile anlegen (401 Unauthorized)

  2. Änderungen
    - Erstellt den fehlenden Trigger `on_auth_user_created`
    - Dieser Trigger ruft `handle_new_user()` auf, wenn ein neuer User angelegt wird
    - Die Funktion hat `SECURITY DEFINER`, sodass sie RLS-Policies umgeht

  3. Sicherheit
    - Der Trigger läuft automatisch im Kontext des Systems
    - User können nicht direkt auf die profiles-Tabelle zugreifen
    - Profile werden nur bei User-Erstellung angelegt
*/

-- Drop old trigger if exists (cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile and tokens for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
