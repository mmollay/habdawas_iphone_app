-- ============================================
-- ADMIN-STATUS SETZEN
-- ============================================
-- Führen Sie diese Queries in der Supabase SQL Editor aus
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. PRÜFEN: Aktuellen Admin-Status anzeigen
-- ============================================
-- Zeigt alle User mit Admin-Status
SELECT
  id,
  email,
  full_name,
  is_admin,
  created_at
FROM profiles
ORDER BY created_at DESC;


-- 2. ADMIN SETZEN: Für einen spezifischen User
-- ============================================
-- WICHTIG: Ersetzen Sie 'ihre.email@example.com' mit Ihrer echten E-Mail

-- Option A: Setze Admin via E-Mail
UPDATE profiles
SET is_admin = true
WHERE email = 'ihre.email@example.com';

-- Option B: Setze Admin via User ID (wenn Sie die ID kennen)
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = 'user-id-hier-einfügen';


-- 3. VERIFIZIEREN: Admin-Status überprüfen
-- ============================================
SELECT
  id,
  email,
  full_name,
  is_admin
FROM profiles
WHERE is_admin = true;


-- 4. ADMIN ENTFERNEN (falls nötig)
-- ============================================
-- UPDATE profiles
-- SET is_admin = false
-- WHERE email = 'ihre.email@example.com';


-- ============================================
-- ZUSATZ-INFO
-- ============================================
-- Nach dem Setzen von is_admin = true:
-- 1. Browser-Cache leeren oder Inkognito-Modus verwenden
-- 2. Neu anmelden
-- 3. Zu Einstellungen navigieren
-- 4. "Administration" Menüpunkt sollte sichtbar sein
