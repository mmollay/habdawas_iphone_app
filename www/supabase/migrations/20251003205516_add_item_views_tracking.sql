/*
  # Item Views Tracking System

  1. Neue Tabellen
    - `item_views`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key zu items)
      - `viewer_id` (uuid, nullable, foreign key zu auth.users für eingeloggte User)
      - `session_fingerprint` (text, Browser-Fingerprint für anonyme User)
      - `viewed_at` (timestamp)
      - Unique Constraint auf (item_id, viewer_id) für eingeloggte User
      - Unique Constraint auf (item_id, session_fingerprint) für anonyme User

  2. Neue Spalten in items
    - `view_count` (integer, default 0)
      - Denormalisierte Spalte für schnelle Abfragen
      - Wird per Trigger automatisch aktualisiert

  3. Security
    - Enable RLS auf `item_views` Tabelle
    - Policies:
      - Jeder kann Views erstellen (INSERT)
      - Nur Item-Besitzer können ihre Views sehen (SELECT)
    - Trigger für automatisches Hochzählen des view_count

  4. Performance
    - Index auf item_id für schnelle View-Count-Abfragen
    - Index auf viewer_id für User-Statistiken
    - Index auf viewed_at für zeitbasierte Analysen
*/

-- Tabelle für View-Tracking erstellen
CREATE TABLE IF NOT EXISTS item_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_fingerprint text,
  viewed_at timestamptz DEFAULT now(),
  
  -- Sicherstellen dass jeder User/Session ein Item nur einmal ansehen kann
  CONSTRAINT unique_user_view UNIQUE NULLS NOT DISTINCT (item_id, viewer_id, session_fingerprint)
);

-- View Count Spalte zu items hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE items ADD COLUMN view_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_item_views_item_id ON item_views(item_id);
CREATE INDEX IF NOT EXISTS idx_item_views_viewer_id ON item_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_item_views_viewed_at ON item_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_item_views_fingerprint ON item_views(session_fingerprint);

-- RLS aktivieren
ALTER TABLE item_views ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann Views erstellen (für Tracking)
CREATE POLICY "Anyone can create views"
  ON item_views FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Item-Besitzer können alle Views ihrer Items sehen
CREATE POLICY "Item owners can view their item views"
  ON item_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_views.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Policy: Admins können alle Views sehen (optional, für zukünftige Admin-Features)
CREATE POLICY "Public can read view counts"
  ON item_views FOR SELECT
  TO public
  USING (true);

-- Funktion zum Aktualisieren des view_count
CREATE OR REPLACE FUNCTION update_item_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Bei INSERT: view_count erhöhen
  IF TG_OP = 'INSERT' THEN
    UPDATE items
    SET view_count = view_count + 1
    WHERE id = NEW.item_id;
    RETURN NEW;
  END IF;
  
  -- Bei DELETE: view_count verringern
  IF TG_OP = 'DELETE' THEN
    UPDATE items
    SET view_count = GREATEST(0, view_count - 1)
    WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für automatisches Update des view_count
DROP TRIGGER IF EXISTS trigger_update_item_view_count ON item_views;
CREATE TRIGGER trigger_update_item_view_count
  AFTER INSERT OR DELETE ON item_views
  FOR EACH ROW
  EXECUTE FUNCTION update_item_view_count();

-- View_count für existierende Items initialisieren
UPDATE items
SET view_count = 0
WHERE view_count IS NULL;