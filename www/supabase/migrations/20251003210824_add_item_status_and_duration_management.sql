/*
  # Item Status & Duration Management

  1. Änderungen an items Tabelle
    - Status bleibt text (draft, published, paused, sold, archived, expired)
    - Neue Spalten:
      - `published_at` (timestamptz) - Zeitpunkt der Veröffentlichung
      - `expires_at` (timestamptz) - Ablaufdatum basierend auf duration
      - `duration_days` (integer) - Schaltdauer in Tagen (10-30)
      - `paused_at` (timestamptz) - Zeitpunkt des Pausierens

  2. Änderungen an profiles Tabelle
    - Neue Spalte:
      - `default_listing_duration` (integer, default 30) - Standard-Schaltdauer in Tagen

  3. Functions & Triggers
    - Funktion zum automatischen Setzen von expires_at bei Veröffentlichung
    - Index für effiziente Abfragen nach Status und Ablaufdatum

  4. Security
    - RLS Policies aktualisiert für neue Statuses
    - Nur published Items sind öffentlich sichtbar
    - User können alle eigenen Items sehen (egal welcher Status)
*/

-- Neue Spalten zu items hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE items ADD COLUMN published_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE items ADD COLUMN expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE items ADD COLUMN duration_days integer DEFAULT 30 CHECK (duration_days >= 10 AND duration_days <= 30);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'paused_at'
  ) THEN
    ALTER TABLE items ADD COLUMN paused_at timestamptz;
  END IF;
END $$;

-- Check Constraint für Status-Werte hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'items_status_check'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_status_check 
      CHECK (status IN ('draft', 'published', 'paused', 'sold', 'archived', 'expired'));
  END IF;
END $$;

-- Standard-Schaltdauer zu profiles hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'default_listing_duration'
  ) THEN
    ALTER TABLE profiles ADD COLUMN default_listing_duration integer DEFAULT 30 CHECK (default_listing_duration >= 10 AND default_listing_duration <= 30);
  END IF;
END $$;

-- Funktion zum automatischen Setzen von published_at und expires_at
CREATE OR REPLACE FUNCTION set_item_publication_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Wenn Status auf 'published' gesetzt wird und noch kein published_at existiert
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at = now();
    -- Ablaufdatum basierend auf duration_days setzen
    NEW.expires_at = now() + (COALESCE(NEW.duration_days, 30) || ' days')::interval;
  END IF;

  -- Wenn Status auf 'paused' gesetzt wird
  IF NEW.status = 'paused' AND (OLD.status IS NULL OR OLD.status != 'paused') THEN
    NEW.paused_at = now();
  END IF;

  -- Wenn von 'paused' zurück zu 'published' gewechselt wird
  IF NEW.status = 'published' AND OLD.status = 'paused' THEN
    -- Pausierte Zeit berechnen und zum Ablaufdatum hinzufügen
    IF OLD.paused_at IS NOT NULL AND OLD.expires_at IS NOT NULL THEN
      NEW.expires_at = OLD.expires_at + (now() - OLD.paused_at);
    END IF;
    NEW.paused_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für automatisches Setzen der Publikationsdaten
DROP TRIGGER IF EXISTS trigger_set_item_publication_dates ON items;
CREATE TRIGGER trigger_set_item_publication_dates
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION set_item_publication_dates();

-- Trigger auch bei INSERT, falls direkt published
DROP TRIGGER IF EXISTS trigger_set_item_publication_dates_insert ON items;
CREATE TRIGGER trigger_set_item_publication_dates_insert
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION set_item_publication_dates();

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_expires_at ON items(expires_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_items_user_status ON items(user_id, status);

-- RLS Policy aktualisieren: Nur published Items sind öffentlich sichtbar
DROP POLICY IF EXISTS "Public can view published items" ON items;
CREATE POLICY "Public can view published items"
  ON items FOR SELECT
  TO public
  USING (status = 'published' AND (expires_at IS NULL OR expires_at > now()));

-- Policy: User können alle eigenen Items sehen
DROP POLICY IF EXISTS "Users can view own items" ON items;
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: User können eigene Items updaten
DROP POLICY IF EXISTS "Users can update own items" ON items;
CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: User können eigene Items löschen
DROP POLICY IF EXISTS "Users can delete own items" ON items;
CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Existierende Items aktualisieren: published Items bekommen published_at und expires_at
UPDATE items
SET 
  published_at = created_at,
  expires_at = created_at + interval '30 days',
  duration_days = 30
WHERE status = 'published' 
  AND published_at IS NULL;