/*
  # Draft-System für Inline-Editing

  1. Neue Felder
    - `has_draft` (boolean) - Zeigt an, ob ein Draft existiert
    - `draft_data` (jsonb) - Speichert alle Draft-Änderungen
    - `draft_updated_at` (timestamptz) - Letztes Update des Drafts

  2. Beschreibung
    - Ermöglicht WYSIWYG-Editing direkt in der Detailansicht
    - Änderungen werden automatisch im draft_data gespeichert
    - Beim Veröffentlichen wird draft_data in die Hauptfelder übertragen
    - Drafts sind nur für den Besitzer sichtbar

  3. Security
    - RLS-Policies bleiben bestehen
    - Nur der Besitzer kann Drafts sehen und bearbeiten
*/

-- Add draft system columns to items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'has_draft'
  ) THEN
    ALTER TABLE items ADD COLUMN has_draft boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'draft_data'
  ) THEN
    ALTER TABLE items ADD COLUMN draft_data jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'draft_updated_at'
  ) THEN
    ALTER TABLE items ADD COLUMN draft_updated_at timestamptz;
  END IF;
END $$;

-- Create index for has_draft for faster queries
CREATE INDEX IF NOT EXISTS idx_items_has_draft ON items(user_id, has_draft) WHERE has_draft = true;

-- Create index for draft_updated_at
CREATE INDEX IF NOT EXISTS idx_items_draft_updated_at ON items(draft_updated_at) WHERE draft_updated_at IS NOT NULL;
