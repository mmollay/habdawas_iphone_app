# TODO Liste - HABDAWAS.at

Diese Datei enthält geplante Features und Verbesserungen, die später implementiert werden sollen.

---

## 🔐 Moderations-System (Erweiterungen)

### ✅ Bereits implementiert
- [x] Rollen & Berechtigungen System in Datenbank
- [x] Admin-Panel für Rollenverwaltung
- [x] Berechtigungsprüfung (`usePermissions` Hook)
- [x] Item-Moderation UI (Approve/Reject)
- [x] Moderations-Bar auf Item-Detail-Seite

### 📋 Noch offen (optional)

#### Bulk-Moderation
- [ ] Mehrere Items gleichzeitig auswählen
- [ ] Batch-Aktionen: Approve, Reject, Delete
- [ ] Filter für zu moderierende Items
- [ ] Queue-System für Moderatoren

**Priorität:** Medium
**Geschätzter Aufwand:** 4-6 Stunden

---

#### Moderations-Historie / Audit-Log
- [ ] Datenbank-Tabelle für Moderation-Events
- [ ] Logging aller Moderationsaktionen
- [ ] UI zur Anzeige der Historie
- [ ] Filter nach Moderator, Item, Aktion, Zeitraum
- [ ] Export-Funktion für Audit-Berichte

**Priorität:** Medium
**Geschätzter Aufwand:** 6-8 Stunden

**Datenbank-Schema (Vorschlag):**
```sql
CREATE TABLE moderation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid REFERENCES auth.users(id),
  item_id uuid REFERENCES items(id),
  action text NOT NULL, -- 'approve', 'reject', 'delete'
  reason text,
  old_status text,
  new_status text,
  created_at timestamptz DEFAULT now()
);
```

---

#### Message-Moderation UI
- [ ] Übersicht aller gemeldeten Nachrichten
- [ ] Melde-Funktion für Benutzer
- [ ] Moderations-Aktionen für Messages
- [ ] Warnsystem für problematische User
- [ ] Automatische Spam-Erkennung (optional)

**Priorität:** Low
**Geschätzter Aufwand:** 8-10 Stunden

---

#### Analytics-Dashboard für Support
- [ ] Übersicht über Moderations-Statistiken
- [ ] Anzahl moderierter Items pro Tag/Woche
- [ ] Durchschnittliche Reaktionszeit
- [ ] Häufigste Ablehnungsgründe
- [ ] Performance-Metriken der Moderatoren
- [ ] Grafische Darstellung (Charts)

**Priorität:** Low
**Geschätzter Aufwand:** 10-12 Stunden

**Benötigte Libraries:**
- Chart.js oder Recharts für Visualisierung
- Date-Range Picker für Zeitraum-Auswahl

---

## 🎨 UI/UX Verbesserungen

### Noch offen
- [ ] Dark Mode Support
- [ ] Barrierefreiheit (ARIA Labels, Keyboard Navigation)
- [ ] Mobile Optimierungen für Admin-Panel
- [ ] Erweiterte Filtermöglichkeiten für Items
- [ ] Gespeicherte Suchen / Favoriten-Filter

---

## 💚 Community Credit System - Gamification & Marketing

### 🏆 Hall of Fame / Top-Spender Dashboard
**Priorität:** HIGH 🔥
**Geschätzter Aufwand:** 8-12 Stunden

#### Features:
- [ ] **Public Leaderboard**
  - Top 10/20/50 Spender (All-Time + Monthly)
  - Ranking-System mit Punkten
  - Optional: Anonyme vs. Öffentliche Darstellung (User-Wahl)

- [ ] **Spender-Profile & Marketing**
  - Spender können Logo/Bild hochladen
  - Link zu ihren Produkten/Dienstleistungen
  - "Unterstützt von..." Badge auf Inseraten
  - Firmen: CSR-Statement Display
  - "Community Hero" Profil-Badge

- [ ] **Achievement-System / Badges**
  - Bronze/Silber/Gold/Platin Spender
  - Meilenstein-Badges (Erste Spende, 50€, 100€, 500€, etc.)
  - "Jahrestreue" Badge (12 Monate in Folge)
  - Exklusive Benefits für Top-Spender

- [ ] **Transparenz & Impact**
  - "Spenden-Impact" Dashboard: "Deine 50€ = 250 Inserate ermöglicht"
  - Monatliche Erfolgsberichte
  - "Dank 47 Spendern: 2.450 kostenfreie Inserate"
  - Visualisierung: Community-Topf Entwicklung (Charts)

- [ ] **Nominierungen & Anerkennung**
  - User können Top-Spender nominieren
  - Monatliche "Community Champion" Auszeichnung
  - Social Media Integration (Teilen der Erfolge)
  - Dankeskarten-Generator (Share auf Social Media)

#### Technische Umsetzung:
```sql
-- Bereits vorhanden in donations Tabelle:
-- user_id, amount, donation_type, credits_granted
-- Perfekt für Tracking!

-- Neue Tabellen (optional):
CREATE TABLE donor_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id),
  logo_url text,
  company_name text,
  website_url text,
  csr_statement text,
  show_publicly boolean DEFAULT false,
  badges jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nominated_user_id uuid REFERENCES profiles(id),
  nominator_id uuid REFERENCES profiles(id),
  reason text,
  created_at timestamptz DEFAULT now()
);
```

#### UI/UX Components:
- [ ] HallOfFamePage (Public)
- [ ] DonorProfileCard
- [ ] LeaderboardTable
- [ ] BadgeDisplay Component
- [ ] ImpactDashboard
- [ ] NominationForm

#### Marketing-Nutzen:
- ✨ Mehr Spenden durch öffentliche Anerkennung
- 🏢 Attraktiv für Firmen (CSR Marketing)
- 🌱 Fördert "grünen Gedanken"
- 📈 Community-Engagement steigt
- 💼 Win-Win: Spender bekommen Marketing, Platform bekommt Funding

---

## 📊 Token-System Erweiterungen

### Noch offen
- [ ] Token-Geschenke zwischen Benutzern
- [ ] Rabatt-Codes / Gutscheine
- [ ] Abo-Modelle (monatliche Token-Pakete)
- [ ] Token-Rückerstattungen bei Problemen
- [ ] Detaillierte Token-Historie für User

---

## 🔔 Benachrichtigungen

### Noch offen
- [ ] Email-Benachrichtigungen (Supabase Auth Emails)
- [ ] Push-Benachrichtigungen (Web Push API)
- [ ] Benachrichtigungs-Zentrale in der App
- [ ] Benachrichtigungs-Einstellungen (Granular)
- [ ] SMS-Benachrichtigungen (optional, Twilio)

---

## 🛡️ Sicherheit & Performance

### Noch offen
- [ ] Rate Limiting für API-Calls
- [ ] CAPTCHA für Registrierung/Login
- [ ] 2FA (Two-Factor Authentication)
- [ ] Image Optimization / CDN
- [ ] Lazy Loading für große Listen
- [ ] Service Worker für Offline-Support
- [ ] Datenbank-Indizes optimieren

---

## 📱 Mobile App

### Noch offen
- [ ] React Native App (iOS/Android)
- [ ] Progressive Web App (PWA) Features
- [ ] App Store / Play Store Veröffentlichung

**Priorität:** Future
**Geschätzter Aufwand:** 100+ Stunden

---

## 🧪 Testing & QA

### Noch offen
- [ ] Unit Tests (Vitest)
- [ ] Integration Tests
- [ ] E2E Tests (Playwright/Cypress)
- [ ] Automatisierte Screenshot Tests
- [ ] Performance Testing
- [ ] Security Audits

---

## 📝 Dokumentation

### Noch offen
- [ ] API-Dokumentation
- [ ] User Guide / Hilfe-Seiten erweitern
- [ ] Admin-Handbuch
- [ ] Video-Tutorials
- [ ] FAQ-Bereich erweitern

---

## 🌍 Internationalisierung

### Noch offen
- [ ] Multi-Language Support (i18n)
- [ ] Englische Übersetzung
- [ ] Weitere Sprachen (Türkisch, etc.)
- [ ] Währungsumrechnung

---

## 💡 Neue Features (Ideen)

- [ ] Bewertungssystem für Verkäufer
- [ ] Verifizierte Verkäufer Badge
- [ ] Automatische Preis-Vorschläge (AI)
- [ ] Ähnliche Artikel anzeigen
- [ ] Wunschliste / Merkliste erweitern
- [ ] Social Media Integration (Teilen)
- [ ] QR-Code für Items
- [ ] Versand-Tracking Integration
- [ ] Escrow-System für sichere Zahlungen
- [ ] Live-Chat zwischen Käufer/Verkäufer

---

## 📋 Notizen

### Wichtig für Implementierung:
- Alle Moderations-Features müssen RLS-Policies berücksichtigen
- Token-System muss transaktionssicher sein
- Performance bei großen Datenmengen beachten
- Mobile-First Design beibehalten

### Technische Schulden:
- Bundle Size optimieren (aktuell 730 kB)
- Code Splitting verbessern
- Wiederverwendbare Komponenten extrahieren

---

**Stand:** 7. Oktober 2025
**Nächste Review:** Bei Bedarf
