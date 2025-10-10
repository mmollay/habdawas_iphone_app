# 📱 HabDaWas Push Notifications - Vollständiges Setup

**Check!!** - Diese Anleitung führt Sie Schritt-für-Schritt durch die komplette Push Notification Integration mit Supabase!

---

## 📋 Übersicht

Sie bekommen eine Push Notification wenn:
- ✅ Ein User ein neues Produkt einstellt
- ✅ Ein User Ihnen eine Nachricht schreibt
- ✅ Ein Produkt verkauft wurde
- ✅ Jemand Ihr Produkt favorisiert

---

## 🔧 Voraussetzungen

### 1️⃣ Apple Developer Account
- **Preis**: 99€/Jahr
- **Link**: https://developer.apple.com/programs/
- **Benötigt für**: APNs (Apple Push Notification service)

### 2️⃣ Supabase Account
- **Preis**: Kostenlos (für Start)
- **Link**: https://supabase.com
- **Status**: ✅ Sie haben bereits einen

### 3️⃣ Xcode
- **Status**: ✅ Bereits installiert (Version 26.0.1)

---

## 📱 Part 1: Apple Developer Setup

### Step 1: APNs Key erstellen

1. Gehen Sie zu: https://developer.apple.com/account/resources/authkeys/list
2. Klicken Sie auf **+** (Create a Key)
3. Name: `HabDaWas Push Notifications`
4. Aktivieren Sie: **Apple Push Notifications service (APNs)**
5. Klicken Sie auf **Continue** → **Register**
6. **WICHTIG**: Laden Sie die `.p8` Datei herunter (nur 1x möglich!)
7. Notieren Sie:
   - **Key ID** (z.B. `ABC123XYZ`)
   - **Team ID** (in der oberen rechten Ecke, z.B. `TEAM123456`)

### Step 2: App ID konfigurieren

1. Gehen Sie zu: https://developer.apple.com/account/resources/identifiers/list
2. Suchen Sie `at.habdawas.app` oder erstellen Sie sie:
   - Klicken Sie auf **+**
   - Wählen Sie **App IDs**
   - Description: `HabDaWas`
   - Bundle ID: `at.habdawas.app`
3. Aktivieren Sie: **Push Notifications**
4. Klicken Sie auf **Save**

---

## 🗄️ Part 2: Supabase Setup

### Step 1: Database Schema installieren

1. Öffnen Sie: https://supabase.com/dashboard → Ihr Projekt
2. Gehen Sie zu: **SQL Editor**
3. Öffnen Sie die Datei: `/supabase/schema.sql`
4. Kopieren Sie den kompletten Code
5. Fügen Sie ihn in den SQL Editor ein
6. Klicken Sie auf **Run**
7. ✅ Sie sollten jetzt 3 neue Tabellen haben:
   - `device_tokens`
   - `notification_logs`
   - `notification_queue`

### Step 2: Edge Function deployen

#### Installation Supabase CLI

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Oder via npm
npm install -g supabase
```

#### Deployment

```bash
# 1. Login
supabase login

# 2. Link zu Ihrem Projekt
cd /Users/martinmollay/Development/iphone_app
supabase link --project-ref YOUR_PROJECT_REF

# 3. Secrets setzen (APNs Credentials)
supabase secrets set APNS_KEY_ID="ABC123XYZ"
supabase secrets set APNS_TEAM_ID="TEAM123456"
supabase secrets set APNS_KEY_P8="-----BEGIN PRIVATE KEY-----
[Ihr kompletter P8 Key Content hier]
-----END PRIVATE KEY-----"

# 4. Edge Function deployen
supabase functions deploy send-push-notification
```

**WICHTIG**: Ersetzen Sie `YOUR_PROJECT_REF` mit Ihrer echten Supabase Project Reference (z.B. `abcdefghijklmnopqrst`)

### Step 3: Database Triggers aktivieren

1. Öffnen Sie: `/supabase/triggers.sql`
2. **Passen Sie die Tabellennamen an**:
   - Ersetzen Sie `products` mit Ihrem tatsächlichen Tabellennamen
   - Ersetzen Sie `messages` mit Ihrem Nachricht-Tabellennamen
   - Setzen Sie die Admin User-ID (Zeile 27: `admin_user_id BIGINT := 1;`)
3. Entfernen Sie die Kommentare bei den `CREATE TRIGGER` Statements
4. Führen Sie das Script in Supabase SQL Editor aus

---

## 🎨 Part 3: Frontend Integration

### Step 1: Supabase Client konfigurieren

Öffnen Sie: `/www/supabase-notifications.js`

Ersetzen Sie Zeilen 8-9:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';  // ⚠️ ÄNDERN
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';  // ⚠️ ÄNDERN
```

**Wo finden Sie diese Werte?**
1. Supabase Dashboard → Settings → API
2. **Project URL** → Kopieren
3. **anon/public key** → Kopieren

### Step 2: Integration in beta.habdawas.at

Fügen Sie in Ihre Haupt-JavaScript-Datei ein:

```javascript
// Importieren Sie die Supabase Notifications
import { initSupabasePushNotifications } from './supabase-notifications.js';

// Nach erfolgreicher User-Anmeldung:
const userId = 123;  // Ihre User-ID aus dem Login
initSupabasePushNotifications(userId);
```

**Vollständiges Beispiel:**

```javascript
// In Ihrer Login-Function:
async function handleLogin(username, password) {
    try {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // ✅ User erfolgreich eingeloggt
            const userId = data.user.id;

            // ✅ Push Notifications initialisieren
            initSupabasePushNotifications(userId);

            // Weiter mit Ihrer App-Logik...
        }
    } catch (error) {
        console.error('Login failed:', error);
    }
}
```

### Step 3: Bei Logout Device Token entfernen

```javascript
import { removeDeviceToken } from './supabase-notifications.js';

async function handleLogout() {
    const deviceToken = localStorage.getItem('device_token');  // Token vorher speichern
    if (deviceToken) {
        await removeDeviceToken(deviceToken);
    }

    // Weiter mit Logout-Logik...
}
```

---

## 📲 Part 4: iOS App neu builden

```bash
# 1. Capacitor Sync
npx cap sync ios

# 2. Xcode öffnen
npx cap open ios

# 3. In Xcode:
# - Wählen Sie Ihr Development Team (Signing & Capabilities)
# - Aktivieren Sie "Push Notifications" Capability (sollte automatisch sein)
# - Build & Run auf physischem iPhone (Simulator unterstützt KEINE Push Notifications!)
```

**WICHTIG**: Push Notifications funktionieren **NUR auf physischem iPhone**, NICHT im Simulator!

---

## 🧪 Part 5: Testing

### Test 1: Device Token Registration

1. Bauen Sie die App auf Ihr iPhone
2. Starten Sie die App
3. Login durchführen
4. Überprüfen Sie in Supabase:

```sql
SELECT * FROM device_tokens ORDER BY created_at DESC LIMIT 5;
```

Sie sollten einen neuen Eintrag mit Ihrem Device Token sehen!

### Test 2: Manuelle Notification senden

Verwenden Sie Supabase SQL Editor:

```sql
-- An Ihren User eine Test-Notification senden
SELECT send_notification_to_user(
    1,  -- Ihre User-ID
    'Test Notification 🎉',
    'Dies ist eine Test Push Notification von HabDaWas!',
    '{"test": true}'::jsonb
);

-- Queue verarbeiten (manuell)
SELECT process_notification_queue();
```

**ODER** via Edge Function direkt:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "title": "Test Notification",
    "body": "Hello from Supabase!"
  }'
```

### Test 3: Automatischer Trigger

1. Erstellen Sie ein neues Produkt in beta.habdawas.at
2. Warten Sie 5-10 Sekunden
3. Sie sollten eine Push Notification auf Ihrem iPhone bekommen!

---

## 🔄 Part 6: Automatisierung (Queue Processing)

### Option A: Supabase Cron (Empfohlen)

```sql
-- pg_cron Extension aktivieren (in Supabase Dashboard → Database → Extensions)

-- Cron-Job erstellen (alle 5 Minuten)
SELECT cron.schedule(
    'process-notification-queue',
    '*/5 * * * *',
    $$ SELECT process_notification_queue(); $$
);

-- Cron-Jobs anzeigen
SELECT * FROM cron.job;
```

### Option B: Externer Cron-Job

Erstellen Sie einen Cron-Job auf Ihrem Server:

```bash
# Crontab öffnen
crontab -e

# Jede Minute ausführen
* * * * * curl -X POST https://YOUR_PROJECT.supabase.co/rest/v1/rpc/process_notification_queue \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 📊 Monitoring & Debugging

### Device Tokens überprüfen

```sql
-- Alle aktiven Geräte
SELECT
    user_id,
    platform,
    last_active,
    created_at
FROM device_tokens
WHERE last_active > NOW() - INTERVAL '30 days'
ORDER BY last_active DESC;
```

### Notification Logs

```sql
-- Letzte 10 gesendete Notifications
SELECT
    title,
    body,
    status,
    error_message,
    sent_at
FROM notification_logs
ORDER BY sent_at DESC
LIMIT 10;

-- Failed Notifications
SELECT * FROM notification_logs
WHERE status = 'failed'
ORDER BY sent_at DESC;
```

### Queue Status

```sql
-- Pending Notifications
SELECT * FROM notification_queue
WHERE status = 'pending'
ORDER BY scheduled_for ASC;

-- Failed in Queue
SELECT * FROM notification_queue
WHERE status = 'failed';
```

---

## 🚨 Troubleshooting

### Problem: Keine Device Token in DB

**Lösung**:
1. Überprüfen Sie Xcode Console auf Fehler
2. Prüfen Sie ob Push Notification Permission gewährt wurde
3. Stellen Sie sicher dass `initSupabasePushNotifications()` nach Login aufgerufen wird

### Problem: Edge Function Fehler

**Lösung**:
```bash
# Logs anzeigen
supabase functions logs send-push-notification

# Secrets überprüfen
supabase secrets list
```

### Problem: APNs Fehler "BadDeviceToken"

**Lösung**:
- Device Token ist abgelaufen → Automatisch bei nächstem App-Start erneuert
- Falsches Environment (development vs production) → Prüfen Sie APNS_ENDPOINT in Edge Function

### Problem: Notifications kommen nicht an

**Checklist**:
- [ ] Physisches iPhone (nicht Simulator)
- [ ] Push Notifications in iOS Settings aktiviert
- [ ] Device Token in Supabase vorhanden
- [ ] Edge Function deployed
- [ ] APNs Credentials korrekt gesetzt
- [ ] Queue wird verarbeitet (Cron-Job läuft)

---

## 📝 Production Checklist

Vor App Store Release:

- [ ] **APNs Environment** auf Production ändern:
  ```typescript
  // In send-push-notification/index.ts:
  const APNS_ENDPOINT = 'https://api.push.apple.com'  // ✅ Production
  ```

- [ ] **Push Notifications Capability** in Xcode aktiviert
- [ ] **Production APNs Key** erstellt und in Supabase gesetzt
- [ ] **App ID** mit Push Notifications konfiguriert
- [ ] **Info.plist** enthält Notification Usage Description (optional)
- [ ] **Row Level Security** in Supabase aktiviert
- [ ] **Cron-Job** für Queue Processing läuft
- [ ] **Monitoring** eingerichtet (z.B. Failed Notifications Alert)

---

## 🎯 Zusammenfassung: Was passiert bei einer Notification?

```
1. User erstellt Produkt auf beta.habdawas.at
   ↓
2. PostgreSQL Trigger feuert
   ↓
3. Eintrag in notification_queue Tabelle
   ↓
4. Cron-Job ruft process_notification_queue() auf
   ↓
5. Edge Function send-push-notification wird aufgerufen
   ↓
6. Device Token von User aus DB holen
   ↓
7. APNs (Apple Server) kontaktieren
   ↓
8. Push Notification an iPhone senden
   ↓
9. User sieht Notification 🎉
```

---

## 📞 Support

Bei Fragen oder Problemen:

1. **Xcode Logs**: ⌘ + Shift + C in Xcode
2. **Supabase Logs**: Dashboard → Logs
3. **Edge Function Logs**: `supabase functions logs send-push-notification`
4. **Browser Console**: Bei Frontend-Problemen

---

**Setup abgeschlossen!** 🎉

Sie sind jetzt bereit, Push Notifications in Ihrer HabDaWas App zu empfangen!
