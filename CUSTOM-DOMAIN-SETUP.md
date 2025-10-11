# Custom Domain Setup für Supabase (Supabase Pro)

## Warum Custom Domain?

Die Standard-URL `hsbjflixgavjqxvnkivi.supabase.co` sieht unvertrauenswürdig aus und könnte User beim OAuth-Login verunsichern.

Mit Custom Domain wird daraus: `api.habdawas.at` ✅

## Vorteile

- ✅ **Vertrauenswürdig**: User erkennen Ihre Domain
- ✅ **Markenkonform**: habdawas.at statt kryptischer String
- ✅ **Professionell**: Seriöser Eindruck beim OAuth
- ✅ **Security**: User können echte Domain verifizieren

## Voraussetzungen

- ✅ **Supabase Pro Plan** (ab $25/Monat)
- ✅ **Eigene Domain** (habdawas.at)
- ✅ **DNS-Zugriff** auf Domain-Provider

## Setup: Schritt-für-Schritt

### 1. Custom Domain in Supabase konfigurieren

1. **Supabase Dashboard öffnen**: https://supabase.com/dashboard/project/hsbjflixgavjqxvnkivi
2. **Navigation**: Settings (⚙️) → API
3. **Scroll down** zu "Custom Domains" Sektion
4. **Click**: "Add custom domain"
5. **Eingeben**: `api.habdawas.at`
6. **Select**: "Use custom domain for: API"
7. **Add Domain** klicken

### 2. DNS Record einrichten

Supabase zeigt Ihnen jetzt die DNS-Konfiguration:

```
CNAME api.habdawas.at → hsbjflixgavjqxvnkivi.supabase.co
```

**Bei Ihrem Domain-Provider** (z.B. Cloudflare, Namecheap, etc.):

#### Cloudflare
1. Dashboard → DNS → Records
2. Add Record:
   - **Type**: CNAME
   - **Name**: api
   - **Target**: hsbjflixgavjqxvnkivi.supabase.co
   - **Proxy status**: DNS only (grau)
   - **TTL**: Auto
3. Save

#### Namecheap / GoDaddy / Andere
1. Domain Management → DNS Settings
2. Add CNAME Record:
   - **Host**: api
   - **Value**: hsbjflixgavjqxvnkivi.supabase.co
   - **TTL**: Automatic / 3600
3. Save

### 3. DNS Propagation & SSL warten

Nach DNS-Konfiguration:

1. **DNS Check** (1-10 Minuten):
   - Supabase prüft DNS automatisch
   - Status: "Verifying..."

2. **SSL Zertifikat** (automatisch):
   - Let's Encrypt Zertifikat wird generiert
   - Status: "Provisioning SSL..."

3. **Fertig** (5-15 Minuten total):
   - Status: ✅ "Active"
   - Custom Domain ist bereit

**DNS testen:**
```bash
# Prüfen ob CNAME korrekt ist
dig api.habdawas.at CNAME

# Sollte zeigen:
# api.habdawas.at. 300 IN CNAME hsbjflixgavjqxvnkivi.supabase.co
```

### 4. App-Konfiguration aktualisieren

#### A. iOS App (.env)

**Datei**: `/Users/martinmollay/Development/iphone_app/.env`

**Alt**:
```env
VITE_SUPABASE_URL=https://hsbjflixgavjqxvnkivi.supabase.co
```

**Neu**:
```env
VITE_SUPABASE_URL=https://api.habdawas.at
```

#### B. bazar_bold Projekt

**Datei**: `/Users/martinmollay/Development/bazar_bold/.env`

Gleiche Änderung:
```env
VITE_SUPABASE_URL=https://api.habdawas.at
VITE_SUPABASE_ANON_KEY=[bleibt gleich]
```

### 5. Rebuild & Deploy

```bash
# bazar_bold neu bauen
cd /Users/martinmollay/Development/bazar_bold
npm run build

# Build nach iOS App kopieren
cp -r dist/* /Users/martinmollay/Development/iphone_app/www/

# iOS App synchronisieren
cd /Users/martinmollay/Development/iphone_app
npx cap sync ios
```

### 6. Redirect URLs aktualisieren

**Wichtig**: OAuth Redirect URLs müssen auch aktualisiert werden!

**Supabase Dashboard** → Authentication → URL Configuration:

**Bestehende URLs**:
```
https://beta.habdawas.at
https://beta.habdawas.at/
at.habdawas.app://oauth-callback
```

**Zusätzlich hinzufügen** (für Callback):
```
https://api.habdawas.at/auth/v1/callback
```

## Was ändert sich für User?

### Vorher (Standard Supabase URL)

```
[App] → [Google Login] → [Redirect zu hsbjflixgavjqxvnkivi.supabase.co] → [App]
                            ⚠️ Sieht verdächtig aus
```

### Nachher (Custom Domain)

```
[App] → [Google Login] → [Redirect zu api.habdawas.at] → [App]
                            ✅ Vertrauenswürdig!
```

## Testen

### 1. Browser-Test (Web-Version)

```bash
# Öffne Web-Version
open https://beta.habdawas.at

# Login testen
# - Klick auf "Mit Google anmelden"
# - Prüfe URL während Redirect
# - Sollte api.habdawas.at zeigen
```

### 2. iOS App-Test

```bash
# Xcode öffnen
npx cap open ios

# In Xcode: Build & Run (⌘ + R)
# 1. "Mit Google anmelden" klicken
# 2. Google Login durchführen
# 3. App sollte automatisch öffnen
# 4. User eingeloggt
```

### 3. Network-Test

```bash
# API erreichbar?
curl https://api.habdawas.at/rest/v1/

# Sollte Supabase REST API Response zurückgeben
```

## Troubleshooting

### Problem: "Custom Domains" nicht im Dashboard sichtbar

**Ursache**: Nicht auf Supabase Pro Plan
**Lösung**:
1. Settings → Billing
2. Upgrade to Pro ($25/month)

### Problem: DNS Verification schlägt fehl

**Ursache**: DNS nicht korrekt konfiguriert
**Lösung**:
```bash
# DNS prüfen
dig api.habdawas.at CNAME

# Sollte zeigen:
# hsbjflixgavjqxvnkivi.supabase.co
```

**Wenn nicht**:
- Warten (DNS Propagation dauert bis zu 24h)
- CNAME Record nochmal prüfen
- Bei Cloudflare: "Proxy" deaktivieren (nur DNS)

### Problem: SSL Zertifikat wird nicht generiert

**Ursache**: DNS noch nicht propagiert
**Lösung**: Warten, Supabase versucht es automatisch alle 10 Minuten

### Problem: OAuth funktioniert nicht mehr

**Ursache**: Redirect URLs nicht aktualisiert
**Lösung**:
1. Supabase Dashboard → Authentication → URL Configuration
2. `https://api.habdawas.at/auth/v1/callback` hinzufügen
3. Alte URLs NICHT löschen (für Fallback)

### Problem: App zeigt "Network Error"

**Ursache**: Alte Supabase URL noch im Code
**Lösung**:
```bash
# Prüfe alle .env Dateien
grep -r "hsbjflixgavjqxvnkivi" /Users/martinmollay/Development/

# Sollte keine Treffer in bazar_bold oder iphone_app zeigen
```

## Migration zurück (Falls nötig)

Falls Custom Domain Probleme macht:

1. **Supabase**: Custom Domain deaktivieren (nicht löschen)
2. **.env zurücksetzen**:
   ```env
   VITE_SUPABASE_URL=https://hsbjflixgavjqxvnkivi.supabase.co
   ```
3. **Rebuild**: App neu bauen
4. **Deploy**: Neue Version hochladen

Die Standard-URL funktioniert immer weiter!

## Kosten

**Supabase Pro**: $25/Monat
- Inkludiert: Custom Domains (unbegrenzt)
- Inkludiert: Bessere Performance, mehr Speicher, Support

**DNS (Cloudflare)**: Kostenlos
- DNS Hosting kostenlos
- CNAME Records kostenlos

**SSL Zertifikat**: Kostenlos
- Let's Encrypt via Supabase
- Automatische Renewal

## Best Practices

### 1. Beide URLs parallel laufen lassen (Transition)

Für sanfte Migration:
- Custom Domain aktivieren
- Aber alte URL in Redirect URLs behalten
- Erst nach erfolgreichen Tests alte URL entfernen

### 2. Health Checks

```bash
# Regelmäßig testen
curl -I https://api.habdawas.at/rest/v1/

# Sollte 200 OK oder 401 (Auth required) zurückgeben
```

### 3. Monitoring

- Supabase Dashboard → Reports
- Prüfe API Requests
- Schaue auf Fehler-Rate

## Weitere Custom Domains

Sie können auch weitere Domains hinzufügen:

- `api.habdawas.at` → API & Auth
- `storage.habdawas.at` → Supabase Storage
- `realtime.habdawas.at` → Realtime Subscriptions

Jede Domain benötigt einen eigenen CNAME Record.

## Ressourcen

- [Supabase Custom Domains Docs](https://supabase.com/docs/guides/platform/custom-domains)
- [Let's Encrypt SSL](https://letsencrypt.org/)
- [DNS Propagation Check](https://www.whatsmydns.net/)

---

**Status**: 📋 Anleitung erstellt
**Version**: 1.0.0
**Datum**: 2025-10-11
**Voraussetzung**: Supabase Pro Plan
