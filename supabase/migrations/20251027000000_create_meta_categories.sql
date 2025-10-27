-- Meta-Kategorien System für erweiterte Klassifikation
-- Ermöglicht Kategorisierung über die Hauptkategorien hinweg

-- Meta-Kategorien Tabelle
CREATE TABLE IF NOT EXISTS meta_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('sustainability', 'condition', 'seller_type')),
  translations JSONB NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle Abfragen nach Typ
CREATE INDEX idx_meta_categories_type ON meta_categories(type);
CREATE INDEX idx_meta_categories_active ON meta_categories(is_active);

-- Junction-Tabelle für Item-Meta-Kategorie Zuordnung
CREATE TABLE IF NOT EXISTS item_meta_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  meta_category_id UUID NOT NULL REFERENCES meta_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, meta_category_id)
);

-- Indices für performante Abfragen
CREATE INDEX idx_item_meta_categories_item ON item_meta_categories(item_id);
CREATE INDEX idx_item_meta_categories_meta ON item_meta_categories(meta_category_id);
CREATE INDEX idx_item_meta_categories_composite ON item_meta_categories(item_id, meta_category_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_meta_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meta_categories_updated_at
  BEFORE UPDATE ON meta_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_meta_categories_updated_at();

-- Seed Meta-Kategorien

-- 1. Nachhaltigkeit
INSERT INTO meta_categories (slug, type, translations, icon, color, sort_order) VALUES
('nachhaltig', 'sustainability', '{"de": {"name": "Nachhaltig", "description": "Umweltfreundliche und nachhaltige Produkte"}, "en": {"name": "Sustainable", "description": "Environmentally friendly and sustainable products"}}', 'leaf', '#4caf50', 1),
('bio', 'sustainability', '{"de": {"name": "Bio", "description": "Biologisch hergestellte Produkte"}, "en": {"name": "Organic", "description": "Organically produced products"}}', 'sprout', '#8bc34a', 2),
('recycled', 'sustainability', '{"de": {"name": "Recycelt", "description": "Produkte aus recycelten Materialien"}, "en": {"name": "Recycled", "description": "Products made from recycled materials"}}', 'recycle', '#66bb6a', 3),
('upcycled', 'sustainability', '{"de": {"name": "Upcycelt", "description": "Aufgewertete Produkte aus gebrauchten Materialien"}, "en": {"name": "Upcycled", "description": "Upgraded products from used materials"}}', 'arrow-up-circle', '#81c784', 4);

-- 2. Zustand
INSERT INTO meta_categories (slug, type, translations, icon, color, sort_order) VALUES
('neu', 'condition', '{"de": {"name": "Neu", "description": "Fabrikneue Artikel"}, "en": {"name": "New", "description": "Brand new items"}}', 'sparkles', '#2196f3', 1),
('wie-neu', 'condition', '{"de": {"name": "Wie neu", "description": "Kaum genutzt, wie neu"}, "en": {"name": "Like new", "description": "Barely used, like new"}}', 'star', '#42a5f5', 2),
('gut', 'condition', '{"de": {"name": "Gut erhalten", "description": "Gebraucht, aber in gutem Zustand"}, "en": {"name": "Good condition", "description": "Used but in good condition"}}', 'thumbs-up', '#64b5f6', 3),
('gebraucht', 'condition', '{"de": {"name": "Gebraucht", "description": "Deutliche Gebrauchsspuren"}, "en": {"name": "Used", "description": "Visible signs of use"}}', 'package', '#90caf9', 4),
('defekt', 'condition', '{"de": {"name": "Defekt", "description": "Nicht funktionsfähig oder reparaturbedürftig"}, "en": {"name": "Defective", "description": "Not functional or needs repair"}}', 'alert-circle', '#bbdefb', 5);

-- 3. Verkäufer-Typ
INSERT INTO meta_categories (slug, type, translations, icon, color, sort_order) VALUES
('privat', 'seller_type', '{"de": {"name": "Privat", "description": "Von Privatperson"}, "en": {"name": "Private", "description": "From private individual"}}', 'user', '#ff9800', 1),
('gewerblich', 'seller_type', '{"de": {"name": "Gewerblich", "description": "Von gewerblichem Anbieter"}, "en": {"name": "Commercial", "description": "From commercial seller"}}', 'briefcase', '#fb8c00', 2),
('haendler', 'seller_type', '{"de": {"name": "Händler", "description": "Von professionellem Händler"}, "en": {"name": "Dealer", "description": "From professional dealer"}}', 'store', '#f57c00', 3),
('hersteller', 'seller_type', '{"de": {"name": "Hersteller", "description": "Direkt vom Hersteller"}, "en": {"name": "Manufacturer", "description": "Directly from manufacturer"}}', 'factory', '#ef6c00', 4);

-- RLS Policies für meta_categories (öffentlich lesbar)
ALTER TABLE meta_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meta-Kategorien sind öffentlich lesbar"
  ON meta_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Nur Admins können Meta-Kategorien erstellen"
  ON meta_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Nur Admins können Meta-Kategorien aktualisieren"
  ON meta_categories FOR UPDATE
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- RLS Policies für item_meta_categories
ALTER TABLE item_meta_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Item-Meta-Kategorien lesen"
  ON item_meta_categories FOR SELECT
  USING (true);

CREATE POLICY "Item-Eigentümer können Meta-Kategorien zuordnen"
  ON item_meta_categories FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM items WHERE id = item_meta_categories.item_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Item-Eigentümer können Meta-Kategorien entfernen"
  ON item_meta_categories FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM items WHERE id = item_meta_categories.item_id AND user_id = auth.uid()
    )
  );

-- Kommentare
COMMENT ON TABLE meta_categories IS 'Meta-Kategorien für erweiterte Klassifikation (Nachhaltigkeit, Zustand, Verkäufer-Typ)';
COMMENT ON TABLE item_meta_categories IS 'Zuordnung von Items zu Meta-Kategorien';
COMMENT ON COLUMN meta_categories.type IS 'Typ der Meta-Kategorie: sustainability, condition, seller_type';
COMMENT ON COLUMN meta_categories.translations IS 'Multi-Language Übersetzungen mit name und description';
COMMENT ON COLUMN meta_categories.color IS 'Hex-Farbcode für visuelle Darstellung';
