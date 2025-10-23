/*
  # Seed Vehicle Attributes for "Fahrzeuge > Autos"

  Creates standard attributes for cars:
  - Marke (Brand)
  - Leistung (Power in kW/PS)
  - Antriebe (Fuel Type)
  - Farbe (Color)
  - Baujahr (Year)
  - Kilometerstand (Mileage)
  - Erstzulassung (First Registration)
  - TÜV (Technical Inspection)
*/

-- =====================================================
-- Find "Autos" category (Level 2 under "Fahrzeuge")
-- =====================================================
DO $$
DECLARE
  v_fahrzeuge_id UUID;
  v_autos_id UUID;
  v_attr_marke_id UUID;
  v_attr_antrieb_id UUID;
  v_attr_farbe_id UUID;
BEGIN

-- Find Fahrzeuge (Level 1)
SELECT id INTO v_fahrzeuge_id
FROM categories
WHERE level = 1
  AND (
    translations->>'de' ILIKE '%fahrzeug%'
    OR slug ILIKE '%fahrzeug%'
    OR slug ILIKE '%vehicle%'
  )
LIMIT 1;

IF v_fahrzeuge_id IS NULL THEN
  RAISE NOTICE 'Warning: Fahrzeuge category not found. Skipping vehicle attributes.';
  RETURN;
END IF;

-- Find Autos (Level 2 under Fahrzeuge)
SELECT id INTO v_autos_id
FROM categories
WHERE level = 2
  AND parent_id = v_fahrzeuge_id
  AND (
    translations->>'de' ILIKE '%auto%'
    OR slug ILIKE '%auto%'
    OR slug ILIKE '%car%'
  )
LIMIT 1;

IF v_autos_id IS NULL THEN
  RAISE NOTICE 'Warning: Autos category not found. Skipping vehicle attributes.';
  RETURN;
END IF;

RAISE NOTICE 'Found Autos category: %', v_autos_id;

-- =====================================================
-- 1. MARKE (Brand) - Select
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'brand', 'select',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'Marke', 'description', 'Fahrzeugmarke'),
    'en', jsonb_build_object('name', 'Brand', 'description', 'Vehicle brand'),
    'fr', jsonb_build_object('name', 'Marque', 'description', 'Marque du véhicule')
  ),
  true, -- required
  true, -- filterable
  true, -- searchable
  true, -- show in list
  true, -- show in detail
  'badge', -- icon
  10 -- sort order
) RETURNING id INTO v_attr_marke_id;

-- Add popular car brands
INSERT INTO attribute_options (attribute_id, option_key, translations, sort_order) VALUES
  (v_attr_marke_id, 'vw', jsonb_build_object('de', jsonb_build_object('name', 'Volkswagen'), 'en', jsonb_build_object('name', 'Volkswagen'), 'fr', jsonb_build_object('name', 'Volkswagen')), 10),
  (v_attr_marke_id, 'bmw', jsonb_build_object('de', jsonb_build_object('name', 'BMW'), 'en', jsonb_build_object('name', 'BMW'), 'fr', jsonb_build_object('name', 'BMW')), 20),
  (v_attr_marke_id, 'mercedes', jsonb_build_object('de', jsonb_build_object('name', 'Mercedes-Benz'), 'en', jsonb_build_object('name', 'Mercedes-Benz'), 'fr', jsonb_build_object('name', 'Mercedes-Benz')), 30),
  (v_attr_marke_id, 'audi', jsonb_build_object('de', jsonb_build_object('name', 'Audi'), 'en', jsonb_build_object('name', 'Audi'), 'fr', jsonb_build_object('name', 'Audi')), 40),
  (v_attr_marke_id, 'opel', jsonb_build_object('de', jsonb_build_object('name', 'Opel'), 'en', jsonb_build_object('name', 'Opel'), 'fr', jsonb_build_object('name', 'Opel')), 50),
  (v_attr_marke_id, 'ford', jsonb_build_object('de', jsonb_build_object('name', 'Ford'), 'en', jsonb_build_object('name', 'Ford'), 'fr', jsonb_build_object('name', 'Ford')), 60),
  (v_attr_marke_id, 'renault', jsonb_build_object('de', jsonb_build_object('name', 'Renault'), 'en', jsonb_build_object('name', 'Renault'), 'fr', jsonb_build_object('name', 'Renault')), 70),
  (v_attr_marke_id, 'peugeot', jsonb_build_object('de', jsonb_build_object('name', 'Peugeot'), 'en', jsonb_build_object('name', 'Peugeot'), 'fr', jsonb_build_object('name', 'Peugeot')), 80),
  (v_attr_marke_id, 'citroen', jsonb_build_object('de', jsonb_build_object('name', 'Citroën'), 'en', jsonb_build_object('name', 'Citroën'), 'fr', jsonb_build_object('name', 'Citroën')), 90),
  (v_attr_marke_id, 'fiat', jsonb_build_object('de', jsonb_build_object('name', 'Fiat'), 'en', jsonb_build_object('name', 'Fiat'), 'fr', jsonb_build_object('name', 'Fiat')), 100),
  (v_attr_marke_id, 'seat', jsonb_build_object('de', jsonb_build_object('name', 'Seat'), 'en', jsonb_build_object('name', 'Seat'), 'fr', jsonb_build_object('name', 'Seat')), 110),
  (v_attr_marke_id, 'skoda', jsonb_build_object('de', jsonb_build_object('name', 'Škoda'), 'en', jsonb_build_object('name', 'Škoda'), 'fr', jsonb_build_object('name', 'Škoda')), 120),
  (v_attr_marke_id, 'toyota', jsonb_build_object('de', jsonb_build_object('name', 'Toyota'), 'en', jsonb_build_object('name', 'Toyota'), 'fr', jsonb_build_object('name', 'Toyota')), 130),
  (v_attr_marke_id, 'honda', jsonb_build_object('de', jsonb_build_object('name', 'Honda'), 'en', jsonb_build_object('name', 'Honda'), 'fr', jsonb_build_object('name', 'Honda')), 140),
  (v_attr_marke_id, 'mazda', jsonb_build_object('de', jsonb_build_object('name', 'Mazda'), 'en', jsonb_build_object('name', 'Mazda'), 'fr', jsonb_build_object('name', 'Mazda')), 150),
  (v_attr_marke_id, 'nissan', jsonb_build_object('de', jsonb_build_object('name', 'Nissan'), 'en', jsonb_build_object('name', 'Nissan'), 'fr', jsonb_build_object('name', 'Nissan')), 160),
  (v_attr_marke_id, 'hyundai', jsonb_build_object('de', jsonb_build_object('name', 'Hyundai'), 'en', jsonb_build_object('name', 'Hyundai'), 'fr', jsonb_build_object('name', 'Hyundai')), 170),
  (v_attr_marke_id, 'kia', jsonb_build_object('de', jsonb_build_object('name', 'Kia'), 'en', jsonb_build_object('name', 'Kia'), 'fr', jsonb_build_object('name', 'Kia')), 180),
  (v_attr_marke_id, 'volvo', jsonb_build_object('de', jsonb_build_object('name', 'Volvo'), 'en', jsonb_build_object('name', 'Volvo'), 'fr', jsonb_build_object('name', 'Volvo')), 190),
  (v_attr_marke_id, 'tesla', jsonb_build_object('de', jsonb_build_object('name', 'Tesla'), 'en', jsonb_build_object('name', 'Tesla'), 'fr', jsonb_build_object('name', 'Tesla')), 200),
  (v_attr_marke_id, 'other', jsonb_build_object('de', jsonb_build_object('name', 'Andere'), 'en', jsonb_build_object('name', 'Other'), 'fr', jsonb_build_object('name', 'Autre')), 999);

-- =====================================================
-- 2. LEISTUNG (Power in kW) - Range
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, unit, min_value, max_value, step_value,
  is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'power_kw', 'range',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'Leistung', 'description', 'Motorleistung in kW'),
    'en', jsonb_build_object('name', 'Power', 'description', 'Engine power in kW'),
    'fr', jsonb_build_object('name', 'Puissance', 'description', 'Puissance du moteur en kW')
  ),
  'kW', -- unit
  10, -- min: 10 kW
  500, -- max: 500 kW
  5, -- step: 5 kW
  false, -- not required
  true, -- filterable
  false, -- not searchable
  true, -- show in list
  true, -- show in detail
  'zap', -- icon
  20 -- sort order
);

-- =====================================================
-- 3. ANTRIEB (Fuel Type) - Multiselect
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'fuel_type', 'select',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'Antrieb', 'description', 'Kraftstoffart'),
    'en', jsonb_build_object('name', 'Fuel Type', 'description', 'Type of fuel'),
    'fr', jsonb_build_object('name', 'Carburant', 'description', 'Type de carburant')
  ),
  false, -- not required
  true, -- filterable
  true, -- searchable
  true, -- show in list
  true, -- show in detail
  'fuel', -- icon
  30 -- sort order
) RETURNING id INTO v_attr_antrieb_id;

INSERT INTO attribute_options (attribute_id, option_key, translations, sort_order) VALUES
  (v_attr_antrieb_id, 'benzin', jsonb_build_object('de', jsonb_build_object('name', 'Benzin'), 'en', jsonb_build_object('name', 'Petrol'), 'fr', jsonb_build_object('name', 'Essence')), 10),
  (v_attr_antrieb_id, 'diesel', jsonb_build_object('de', jsonb_build_object('name', 'Diesel'), 'en', jsonb_build_object('name', 'Diesel'), 'fr', jsonb_build_object('name', 'Diesel')), 20),
  (v_attr_antrieb_id, 'elektro', jsonb_build_object('de', jsonb_build_object('name', 'Elektro'), 'en', jsonb_build_object('name', 'Electric'), 'fr', jsonb_build_object('name', 'Électrique')), 30),
  (v_attr_antrieb_id, 'hybrid', jsonb_build_object('de', jsonb_build_object('name', 'Hybrid'), 'en', jsonb_build_object('name', 'Hybrid'), 'fr', jsonb_build_object('name', 'Hybride')), 40),
  (v_attr_antrieb_id, 'plugin_hybrid', jsonb_build_object('de', jsonb_build_object('name', 'Plug-in Hybrid'), 'en', jsonb_build_object('name', 'Plug-in Hybrid'), 'fr', jsonb_build_object('name', 'Hybride rechargeable')), 50),
  (v_attr_antrieb_id, 'erdgas', jsonb_build_object('de', jsonb_build_object('name', 'Erdgas (CNG)'), 'en', jsonb_build_object('name', 'Natural Gas (CNG)'), 'fr', jsonb_build_object('name', 'Gaz naturel (CNG)')), 60),
  (v_attr_antrieb_id, 'autogas', jsonb_build_object('de', jsonb_build_object('name', 'Autogas (LPG)'), 'en', jsonb_build_object('name', 'LPG'), 'fr', jsonb_build_object('name', 'GPL')), 70),
  (v_attr_antrieb_id, 'wasserstoff', jsonb_build_object('de', jsonb_build_object('name', 'Wasserstoff'), 'en', jsonb_build_object('name', 'Hydrogen'), 'fr', jsonb_build_object('name', 'Hydrogène')), 80);

-- =====================================================
-- 4. FARBE (Color) - Select
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'color', 'select',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'Farbe', 'description', 'Außenfarbe'),
    'en', jsonb_build_object('name', 'Color', 'description', 'Exterior color'),
    'fr', jsonb_build_object('name', 'Couleur', 'description', 'Couleur extérieure')
  ),
  false, -- not required
  true, -- filterable
  true, -- searchable
  true, -- show in list
  true, -- show in detail
  'palette', -- icon
  40 -- sort order
) RETURNING id INTO v_attr_farbe_id;

INSERT INTO attribute_options (attribute_id, option_key, translations, color, sort_order) VALUES
  (v_attr_farbe_id, 'schwarz', jsonb_build_object('de', jsonb_build_object('name', 'Schwarz'), 'en', jsonb_build_object('name', 'Black'), 'fr', jsonb_build_object('name', 'Noir')), '#000000', 10),
  (v_attr_farbe_id, 'weiss', jsonb_build_object('de', jsonb_build_object('name', 'Weiß'), 'en', jsonb_build_object('name', 'White'), 'fr', jsonb_build_object('name', 'Blanc')), '#FFFFFF', 20),
  (v_attr_farbe_id, 'grau', jsonb_build_object('de', jsonb_build_object('name', 'Grau'), 'en', jsonb_build_object('name', 'Grey'), 'fr', jsonb_build_object('name', 'Gris')), '#808080', 30),
  (v_attr_farbe_id, 'silber', jsonb_build_object('de', jsonb_build_object('name', 'Silber'), 'en', jsonb_build_object('name', 'Silver'), 'fr', jsonb_build_object('name', 'Argent')), '#C0C0C0', 40),
  (v_attr_farbe_id, 'blau', jsonb_build_object('de', jsonb_build_object('name', 'Blau'), 'en', jsonb_build_object('name', 'Blue'), 'fr', jsonb_build_object('name', 'Bleu')), '#0000FF', 50),
  (v_attr_farbe_id, 'rot', jsonb_build_object('de', jsonb_build_object('name', 'Rot'), 'en', jsonb_build_object('name', 'Red'), 'fr', jsonb_build_object('name', 'Rouge')), '#FF0000', 60),
  (v_attr_farbe_id, 'gruen', jsonb_build_object('de', jsonb_build_object('name', 'Grün'), 'en', jsonb_build_object('name', 'Green'), 'fr', jsonb_build_object('name', 'Vert')), '#00FF00', 70),
  (v_attr_farbe_id, 'gelb', jsonb_build_object('de', jsonb_build_object('name', 'Gelb'), 'en', jsonb_build_object('name', 'Yellow'), 'fr', jsonb_build_object('name', 'Jaune')), '#FFFF00', 80),
  (v_attr_farbe_id, 'orange', jsonb_build_object('de', jsonb_build_object('name', 'Orange'), 'en', jsonb_build_object('name', 'Orange'), 'fr', jsonb_build_object('name', 'Orange')), '#FFA500', 90),
  (v_attr_farbe_id, 'braun', jsonb_build_object('de', jsonb_build_object('name', 'Braun'), 'en', jsonb_build_object('name', 'Brown'), 'fr', jsonb_build_object('name', 'Marron')), '#8B4513', 100),
  (v_attr_farbe_id, 'beige', jsonb_build_object('de', jsonb_build_object('name', 'Beige'), 'en', jsonb_build_object('name', 'Beige'), 'fr', jsonb_build_object('name', 'Beige')), '#F5F5DC', 110),
  (v_attr_farbe_id, 'gold', jsonb_build_object('de', jsonb_build_object('name', 'Gold'), 'en', jsonb_build_object('name', 'Gold'), 'fr', jsonb_build_object('name', 'Or')), '#FFD700', 120),
  (v_attr_farbe_id, 'andere', jsonb_build_object('de', jsonb_build_object('name', 'Andere'), 'en', jsonb_build_object('name', 'Other'), 'fr', jsonb_build_object('name', 'Autre')), NULL, 999);

-- =====================================================
-- 5. BAUJAHR (Year of Manufacture) - Year
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, min_value, max_value,
  is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'year', 'year',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'Baujahr', 'description', 'Herstellungsjahr'),
    'en', jsonb_build_object('name', 'Year', 'description', 'Year of manufacture'),
    'fr', jsonb_build_object('name', 'Année', 'description', 'Année de fabrication')
  ),
  1950, -- min year
  2025, -- max year
  false, -- not required
  true, -- filterable
  true, -- searchable
  true, -- show in list
  true, -- show in detail
  'calendar', -- icon
  50 -- sort order
);

-- =====================================================
-- 6. KILOMETERSTAND (Mileage) - Number
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, unit, min_value, max_value, step_value,
  is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'mileage', 'range',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'Kilometerstand', 'description', 'Gefahrene Kilometer'),
    'en', jsonb_build_object('name', 'Mileage', 'description', 'Kilometers driven'),
    'fr', jsonb_build_object('name', 'Kilométrage', 'description', 'Kilomètres parcourus')
  ),
  'km', -- unit
  0, -- min
  500000, -- max
  1000, -- step: 1000 km
  false, -- not required
  true, -- filterable
  false, -- not searchable
  true, -- show in list
  true, -- show in detail
  'gauge', -- icon
  60 -- sort order
);

-- =====================================================
-- 7. ERSTZULASSUNG (First Registration) - Date
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'first_registration', 'date',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'Erstzulassung', 'description', 'Datum der Erstzulassung'),
    'en', jsonb_build_object('name', 'First Registration', 'description', 'Date of first registration'),
    'fr', jsonb_build_object('name', 'Première immatriculation', 'description', 'Date de première immatriculation')
  ),
  false, -- not required
  true, -- filterable
  false, -- not searchable
  false, -- don't show in list
  true, -- show in detail
  'file-text', -- icon
  70 -- sort order
);

-- =====================================================
-- 8. TÜV (Technical Inspection) - Date
-- =====================================================
INSERT INTO category_attributes (
  category_id, attribute_key, attribute_type,
  translations, is_required, is_filterable, is_searchable,
  show_in_list, show_in_detail, icon, sort_order
) VALUES (
  v_autos_id, 'tuv_until', 'date',
  jsonb_build_object(
    'de', jsonb_build_object('name', 'TÜV gültig bis', 'description', 'Nächster TÜV-Termin'),
    'en', jsonb_build_object('name', 'Technical Inspection', 'description', 'Next technical inspection date'),
    'fr', jsonb_build_object('name', 'Contrôle technique', 'description', 'Date du prochain contrôle technique')
  ),
  false, -- not required
  false, -- not filterable
  false, -- not searchable
  false, -- don't show in list
  true, -- show in detail
  'shield-check', -- icon
  80 -- sort order
);

RAISE NOTICE 'Successfully created vehicle attributes for Autos category';

END $$;
