# Datenbank Schema - Bazar App

**Generiert am:** 2025-10-05
**Datenbank:** Supabase PostgreSQL

## Übersicht

Diese Datei dokumentiert die vollständige Datenbankstruktur der Bazar-App, inklusive aller Tabellen, Spalten, Beziehungen, Constraints und Indizes.

---

## Tabellen

### 1. profiles
**Beschreibung:** Benutzerprofil-Informationen

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | - | Primary Key, Foreign Key zu auth.users |
| email | text | NO | - | E-Mail-Adresse |
| full_name | text | YES | - | Vollständiger Name |
| avatar_url | text | YES | - | Profilbild URL |
| phone | text | YES | - | Telefonnummer |
| address | text | YES | - | Adresse |
| postal_code | text | YES | - | Postleitzahl |
| city | text | YES | - | Stadt |
| country | text | YES | 'Deutschland' | Land |
| bio | text | YES | - | Biografie |
| language | text | YES | 'de' | Sprache |
| notifications_enabled | boolean | YES | true | Benachrichtigungen aktiviert |
| email_notifications | boolean | YES | true | E-Mail-Benachrichtigungen |
| newsletter_subscribed | boolean | YES | false | Newsletter abonniert |
| show_phone_publicly | boolean | YES | false | Telefon öffentlich anzeigen |
| default_pickup_address_id | uuid | YES | - | Standard-Abholadresse ID |
| ai_text_style | text | YES | 'balanced' | AI Text-Stil |
| ai_text_length | text | YES | 'medium' | AI Text-Länge |
| ai_include_emoji | boolean | YES | false | AI Emojis verwenden |
| ai_auto_publish | boolean | YES | false | AI Auto-Veröffentlichung |
| ai_allow_line_breaks | boolean | YES | false | AI Zeilenumbrüche erlauben |
| ai_analyze_all_images | boolean | NO | false | AI analysiert alle Bilder |
| shipping_enabled | boolean | YES | false | Versand aktiviert |
| shipping_cost | numeric | YES | 5 | Versandkosten |
| shipping_cost_type | text | YES | 'fixed' | Versandkosten-Typ |
| shipping_description | text | YES | - | Versandbeschreibung |
| pickup_enabled | boolean | YES | true | Abholung aktiviert |
| show_location_publicly | boolean | YES | false | Standort öffentlich anzeigen |
| show_location_to_public | boolean | YES | true | Standort für Öffentlichkeit |
| location_description | text | YES | - | Standortbeschreibung |
| show_ai_shipping_costs | boolean | YES | true | AI-Versandkosten anzeigen |
| default_listing_duration | integer | YES | 30 | Standard-Angebotsdauer |
| hand_preference | text | YES | 'right' | Handpräferenz (left/right) |
| created_at | timestamptz | YES | now() | Erstellungszeitpunkt |
| updated_at | timestamptz | YES | now() | Aktualisierungszeitpunkt |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: id -> auth.users(id) ON DELETE CASCADE
- FOREIGN KEY: default_pickup_address_id -> addresses(id) ON DELETE SET NULL
- CHECK: shipping_cost_type IN ('free', 'fixed', 'ai_calculated')
- CHECK: hand_preference IN ('left', 'right')
- CHECK: default_listing_duration BETWEEN 10 AND 30

---

### 2. items
**Beschreibung:** Verkaufsartikel

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| user_id | uuid | NO | - | Verkäufer ID |
| title | text | NO | - | Artikeltitel |
| description | text | NO | - | Artikelbeschreibung |
| price | numeric | NO | 0 | Preis |
| image_url | text | NO | - | Haupt-Bild URL |
| status | text | NO | 'draft' | Status |
| category | text | YES | - | Kategorie |
| subcategory | text | YES | - | Unterkategorie |
| condition | text | YES | - | Zustand |
| brand | text | YES | - | Marke |
| size | text | YES | - | Größe |
| weight | text | YES | - | Gewicht |
| dimensions_length | text | YES | - | Länge |
| dimensions_width | text | YES | - | Breite |
| dimensions_height | text | YES | - | Höhe |
| material | text | YES | - | Material |
| colors | text[] | YES | - | Farben |
| style | text | YES | - | Stil |
| serial_number | text | YES | - | Seriennummer |
| features | text[] | YES | - | Features |
| accessories | text[] | YES | - | Zubehör |
| tags | text[] | YES | - | Tags |
| postal_code | text | YES | - | Postleitzahl |
| location | text | YES | - | Standort |
| ai_generated | boolean | YES | true | AI-generiert |
| ai_shipping_domestic | numeric | YES | - | AI Versand national |
| ai_shipping_international | numeric | YES | - | AI Versand international |
| estimated_weight_kg | numeric | YES | - | Geschätztes Gewicht |
| package_dimensions | jsonb | YES | - | Paketmaße |
| selected_address_id | uuid | YES | - | Ausgewählte Adresse |
| shipping_from_country | text | YES | - | Versandland |
| snapshot_shipping_enabled | boolean | YES | false | Snapshot: Versand aktiviert |
| snapshot_shipping_cost | numeric | YES | 0 | Snapshot: Versandkosten |
| snapshot_shipping_cost_type | text | YES | 'fixed' | Snapshot: Versandkosten-Typ |
| snapshot_shipping_description | text | YES | - | Snapshot: Versandbeschreibung |
| snapshot_pickup_enabled | boolean | YES | false | Snapshot: Abholung aktiviert |
| snapshot_show_location_publicly | boolean | YES | false | Snapshot: Standort öffentlich |
| snapshot_pickup_address | text | YES | - | Snapshot: Abholadresse |
| snapshot_pickup_postal_code | text | YES | - | Snapshot: Abhol-PLZ |
| snapshot_pickup_city | text | YES | - | Snapshot: Abhol-Stadt |
| snapshot_pickup_country | text | YES | - | Snapshot: Abhol-Land |
| snapshot_location_description | text | YES | - | Snapshot: Standortbeschreibung |
| view_count | integer | NO | 0 | Anzahl der Aufrufe |
| published_at | timestamptz | YES | - | Veröffentlichungszeitpunkt |
| expires_at | timestamptz | YES | - | Ablaufzeitpunkt |
| duration_days | integer | YES | 30 | Dauer in Tagen |
| paused_at | timestamptz | YES | - | Pausiert am |
| search_vector | tsvector | YES | - | Volltextsuchvektor |
| created_at | timestamptz | YES | now() | Erstellungszeitpunkt |
| updated_at | timestamptz | YES | now() | Aktualisierungszeitpunkt |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id -> profiles(id) ON DELETE CASCADE
- FOREIGN KEY: selected_address_id -> addresses(id) ON DELETE SET NULL
- CHECK: status IN ('draft', 'published', 'paused', 'sold', 'archived', 'expired')
- CHECK: snapshot_shipping_cost_type IN ('free', 'fixed', 'ai_calculated')
- CHECK: duration_days BETWEEN 10 AND 30

---

### 3. item_images
**Beschreibung:** Multiple Bilder pro Artikel

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| item_id | uuid | NO | - | Artikel ID |
| image_url | text | NO | - | Bild URL |
| display_order | integer | NO | 0 | Anzeigereihenfolge |
| is_primary | boolean | NO | false | Ist Hauptbild |
| created_at | timestamptz | NO | now() | Erstellungszeitpunkt |
| updated_at | timestamptz | NO | now() | Aktualisierungszeitpunkt |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: item_id -> items(id) ON DELETE CASCADE

---

### 4. addresses
**Beschreibung:** Abholungs- und Versandadressen

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| user_id | uuid | NO | - | Benutzer ID |
| name | text | NO | - | Adressname |
| address | text | NO | - | Adresse |
| postal_code | text | NO | - | Postleitzahl |
| city | text | NO | - | Stadt |
| country | text | YES | 'Deutschland' | Land |
| phone | text | YES | - | Telefonnummer |
| is_default | boolean | YES | false | Ist Standard |
| is_default_shipping | boolean | YES | false | Ist Standard-Versand |
| address_type | text | YES | 'both' | Adresstyp |
| show_phone_publicly | boolean | YES | false | Telefon öffentlich anzeigen |
| created_at | timestamptz | YES | now() | Erstellungszeitpunkt |
| updated_at | timestamptz | YES | now() | Aktualisierungszeitpunkt |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id -> profiles(id) ON DELETE CASCADE
- CHECK: address_type IN ('pickup_only', 'shipping_only', 'both')

---

### 5. favorites
**Beschreibung:** Benutzer-Favoriten

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| user_id | uuid | NO | - | Benutzer ID |
| item_id | uuid | NO | - | Artikel ID |
| created_at | timestamptz | YES | now() | Erstellungszeitpunkt |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id -> auth.users(id) ON DELETE CASCADE
- FOREIGN KEY: item_id -> items(id) ON DELETE CASCADE
- UNIQUE: (user_id, item_id)

---

### 6. conversations
**Beschreibung:** Chat-Konversationen zwischen Käufer und Verkäufer

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| item_id | uuid | NO | - | Artikel ID |
| buyer_id | uuid | NO | - | Käufer ID |
| seller_id | uuid | NO | - | Verkäufer ID |
| created_at | timestamptz | YES | now() | Erstellungszeitpunkt |
| updated_at | timestamptz | YES | now() | Aktualisierungszeitpunkt |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: item_id -> items(id) ON DELETE CASCADE
- FOREIGN KEY: buyer_id -> profiles(id) ON DELETE CASCADE
- FOREIGN KEY: seller_id -> profiles(id) ON DELETE CASCADE
- UNIQUE: (buyer_id, seller_id, item_id)

---

### 7. messages
**Beschreibung:** Chat-Nachrichten

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| conversation_id | uuid | NO | - | Konversation ID |
| sender_id | uuid | NO | - | Absender ID |
| content | text | NO | - | Nachrichteninhalt |
| read | boolean | YES | false | Gelesen |
| created_at | timestamptz | YES | now() | Erstellungszeitpunkt |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: conversation_id -> conversations(id) ON DELETE CASCADE
- FOREIGN KEY: sender_id -> profiles(id) ON DELETE CASCADE

---

### 8. item_views
**Beschreibung:** Tracking von Artikelaufrufen

| Spalte | Typ | Nullable | Default | Beschreibung |
|--------|-----|----------|---------|--------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| item_id | uuid | NO | - | Artikel ID |
| viewer_id | uuid | YES | - | Betrachter ID (null für Gäste) |
| session_fingerprint | text | YES | - | Session-Fingerprint |
| viewed_at | timestamptz | YES | now() | Angesehen am |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: item_id -> items(id) ON DELETE CASCADE
- FOREIGN KEY: viewer_id -> auth.users(id) ON DELETE SET NULL
- UNIQUE NULLS NOT DISTINCT: (item_id, viewer_id, session_fingerprint)

---

### 9. pickup_addresses (VIEW)
**Beschreibung:** Backward-Compatibility View für alte pickup_addresses Tabelle

Zeigt alle Daten aus der `addresses` Tabelle an.

---

## Indizes

### Performance-Indizes

#### items Tabelle
- `idx_items_user_id` - BTREE (user_id)
- `idx_items_status` - BTREE (status)
- `idx_items_created_at` - BTREE (created_at DESC)
- `idx_items_category` - BTREE (category) WHERE category IS NOT NULL
- `idx_items_subcategory` - BTREE (subcategory) WHERE subcategory IS NOT NULL
- `idx_items_user_status` - BTREE (user_id, status)
- `idx_items_status_created` - BTREE (status, created_at DESC)
- `idx_items_expires_at` - BTREE (expires_at) WHERE status = 'published'
- `idx_items_selected_address_id` - BTREE (selected_address_id) WHERE selected_address_id IS NOT NULL

#### Volltext-Suche (items)
- `idx_items_search_vector` - GIN (search_vector)
- `idx_items_title_trgm` - GIN (title gin_trgm_ops)
- `idx_items_description_trgm` - GIN (description gin_trgm_ops)
- `idx_items_brand_trgm` - GIN (brand gin_trgm_ops)

#### favorites Tabelle
- `idx_favorites_user_id` - BTREE (user_id)
- `idx_favorites_item_id` - BTREE (item_id)
- `idx_favorites_user_item` - BTREE (user_id, item_id)

#### conversations Tabelle
- `idx_conversations_buyer_id` - BTREE (buyer_id)
- `idx_conversations_seller_id` - BTREE (seller_id)
- `idx_conversations_item_id` - BTREE (item_id)
- `idx_conversations_buyer_seller_item` - BTREE (buyer_id, seller_id, item_id)
- `idx_conversations_item_buyer` - BTREE (item_id, buyer_id)

#### messages Tabelle
- `idx_messages_conversation_id` - BTREE (conversation_id)
- `idx_messages_sender_id` - BTREE (sender_id)
- `idx_messages_read_status` - BTREE (conversation_id, read) WHERE read = false

#### addresses Tabelle
- `idx_addresses_user_id` - BTREE (user_id)
- `idx_addresses_default` - BTREE (user_id, is_default) WHERE is_default = true
- `idx_pickup_addresses_default_shipping` - BTREE (user_id, is_default_shipping) WHERE is_default_shipping = true

#### item_views Tabelle
- `idx_item_views_item_id` - BTREE (item_id)
- `idx_item_views_viewer_id` - BTREE (viewer_id)
- `idx_item_views_fingerprint` - BTREE (session_fingerprint)
- `idx_item_views_viewed_at` - BTREE (viewed_at)

#### item_images Tabelle
- `idx_item_images_item_id` - BTREE (item_id)
- `idx_item_images_display_order` - BTREE (item_id, display_order)
- `idx_item_images_primary` - BTREE (item_id, is_primary) WHERE is_primary = true

---

## Funktionen

### 1. search_items(search_query text)
**Beschreibung:** Volltextsuche über Artikel

**Rückgabe:** TABLE (id uuid, rank real)

Sucht in: title, description, brand, category, subcategory, material, features, accessories, tags

### 2. get_search_suggestions(search_text text)
**Beschreibung:** Gibt Suchvorschläge zurück

**Rückgabe:** TABLE (suggestion text, type text, count bigint)

Typen:
- `title` - Artikeltitel (max 5)
- `category` - Kategorien (max 3)
- `brand` - Marken (max 2)

---

## Migrationen

Die Datenbank wurde durch folgende Migrationen aufgebaut:

1. `20251002161728_create_bazar_schema.sql` - Basis-Schema
2. `20251002175450_add_extended_item_fields.sql` - Erweiterte Item-Felder
3. `20251003054106_add_location_fields_to_items.sql` - Standort-Felder
4. `20251003055254_create_messages_schema.sql` - Nachrichten-System
5. `20251003074351_add_user_settings_to_profiles.sql` - Benutzereinstellungen
6. `20251003080141_add_advanced_user_settings.sql` - Erweiterte Einstellungen
7. `20251003081618_add_extended_item_fields.sql` - Weitere Item-Felder
8. `20251003125143_create_favorites_schema.sql` - Favoriten-System
9. `20251003125510_add_shipping_settings_to_profiles.sql` - Versand-Einstellungen
10. `20251003132657_add_ai_shipping_calculation_fields.sql` - AI-Versandberechnung
11. `20251003133821_add_ai_allow_line_breaks_field.sql` - AI-Zeilenumbrüche
12. `20251003134357_update_shipping_cost_default.sql` - Versandkosten-Standard
13. `20251003143724_add_address_type_system.sql` - Adresstyp-System
14. `20251003161841_add_shipping_snapshot_to_items.sql` - Versand-Snapshots
15. `20251003163029_add_shipping_cost_type.sql` - Versandkosten-Typ
16. `20251003165845_add_public_items_viewing.sql` - Öffentliche Artikel-Ansicht
17. `20251003170554_add_public_location_visibility_setting.sql` - Standort-Sichtbarkeit
18. `20251003205516_add_item_views_tracking.sql` - Aufruf-Tracking
19. `20251003210824_add_item_status_and_duration_management.sql` - Status & Dauer
20. `20251004124628_add_hand_preference_to_profiles.sql` - Handpräferenz
21. `20251004144146_add_phone_visibility_setting.sql` - Telefon-Sichtbarkeit
22. `20251004144658_add_phone_visibility_to_pickup_addresses.sql` - Telefon bei Adressen
23. `20251004145520_rename_pickup_addresses_to_addresses.sql` - Tabellen-Umbenennung
24. `20251004150000_fix_addresses_constraint_name.sql` - Constraint-Fix
25. `20251004192306_create_pickup_addresses_view_for_backward_compatibility.sql` - Compatibility View
26. `20251004205429_add_item_images_table.sql` - Multi-Bild-Tabelle
27. `20251004205447_add_ai_multi_image_analysis_setting.sql` - AI Multi-Bild
28. `20251004221203_add_full_text_search_indexes.sql` - Volltext-Indizes
29. `20251004222053_add_missing_foreign_key_indexes.sql` - Foreign-Key-Indizes
30. `20251004224314_fix_items_status_constraint.sql` - Status-Constraint-Fix
31. `20251004231738_add_search_items_function.sql` - Such-Funktion
32. `20251004232053_update_search_vector_include_all_fields.sql` - Erweiterte Suche
33. `20251004232226_fix_search_items_function_columns.sql` - Such-Funktion-Fix
34. `20251005053155_add_search_suggestions_function.sql` - Suchvorschläge

---

## Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert mit spezifischen Policies für:
- **SELECT** - Leseberechtigungen
- **INSERT** - Erstellberechtigungen
- **UPDATE** - Aktualisierungsberechtigungen
- **DELETE** - Löschberechtigungen

Policies verwenden `auth.uid()` für Authentifizierung und prüfen Ownership/Membership.

---

## Backups & Wiederherstellung

**Empfohlene Backup-Strategie:**
1. Regelmäßige Supabase-Backups (automatisch)
2. Export kritischer Tabellen als SQL-Dumps
3. Versionierung der Migration-Dateien

**Wiederherstellung:**
```sql
-- Alle Migrationen in Reihenfolge ausführen
-- Von 20251002161728_create_bazar_schema.sql bis zur aktuellsten
```

---

**Ende der Dokumentation**
