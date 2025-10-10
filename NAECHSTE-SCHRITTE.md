# 🎯 Nächste Schritte - Push Notifications

**Check!!** - Ihre Supabase Credentials sind bereits konfiguriert! ✅

---

## ✅ Was bereits erledigt ist:

1. ✅ **iOS App** - Push Notification Capability hinzugefügt
2. ✅ **Frontend Code** - Supabase Integration erstellt
3. ✅ **Supabase Credentials** - Automatisch aus .env eingebunden:
   - URL: `https://hsbjflixgavjqxvnkivi.supabase.co`
   - Project Ref: `hsbjflixgavjqxvnkivi`
4. ✅ **Database Schema** - SQL bereit in `supabase/schema.sql`
5. ✅ **Edge Function** - Code bereit in `supabase/functions/`
6. ✅ **Triggers** - SQL bereit in `supabase/triggers.sql`
7. ✅ **.gitignore** - .env ist geschützt
8. ✅ **Deployment Script** - `deploy-notifications.sh` erstellt

---

## 🚀 Was Sie JETZT tun müssen:

### **Schritt 1: Apple Developer Account** (5 Minuten)

Falls noch nicht vorhanden:
1. Gehen Sie zu: https://developer.apple.com/programs/
2. Registrieren Sie sich (99€/Jahr)
3. Warten Sie auf Freischaltung (dauert ~1 Tag)

### **Schritt 2: APNs Key erstellen** (3 Minuten)

1. https://developer.apple.com/account/resources/authkeys/list
2. Klicken Sie **+** (Create a Key)
3. Name: `HabDaWas Push Notifications`
4. Aktivieren: **Apple Push Notifications service (APNs)**
5. **Continue** → **Register**
6. **WICHTIG**: Laden Sie die `.p8` Datei herunter (nur 1x möglich!)
7. Notieren Sie sich:
   - **Key ID** (z.B. `ABC123XYZ`)
   - **Team ID** (oben rechts, z.B. `TEAM123456`)

### **Schritt 3: Supabase Schema installieren** (2 Minuten)

```bash
# Option A: Direkt im Browser
# 1. Öffnen Sie: https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi/sql
# 2. Öffnen Sie die Datei: supabase/schema.sql
# 3. Kopieren Sie ALLES
# 4. Fügen Sie in SQL Editor ein
# 5. Klicken Sie auf "Run"
```

**ODER**

```bash
# Option B: Via Supabase CLI (wenn installiert)
supabase db push
```

### **Schritt 4: Edge Function deployen** (5 Minuten)

```bash
# Das Deployment-Script ausführen
./deploy-notifications.sh

# Das Script wird Sie nach den APNs Credentials fragen:
# - APNS_KEY_ID
# - APNS_TEAM_ID
# - APNS_KEY_P8 (kompletter P8 Key Content)
```

**ODER manuell:**

```bash
# 1. Supabase CLI installieren
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Projekt linken
supabase link --project-ref hsbjflixgavjqxvnkivi

# 4. APNs Secrets setzen
supabase secrets set APNS_KEY_ID="ABC123XYZ"
supabase secrets set APNS_TEAM_ID="TEAM123456"
supabase secrets set APNS_KEY_P8="-----BEGIN PRIVATE KEY-----
[Ihr P8 Key Content]
-----END PRIVATE KEY-----"

# 5. Edge Function deployen
supabase functions deploy send-push-notification
```

### **Schritt 5: Triggers aktivieren** (2 Minuten)

1. Öffnen Sie: `supabase/triggers.sql`
2. **Zeile 27 ändern**: `admin_user_id BIGINT := 1;`
   - Setzen Sie Ihre Admin User-ID ein
3. Entfernen Sie Kommentare bei `CREATE TRIGGER` Statements
4. Kopieren Sie ALLES in Supabase SQL Editor
5. Run

### **Schritt 6: Frontend Integration** (3 Minuten)

In Ihrer `beta.habdawas.at` Login-Funktion:

```javascript
// Import (am Anfang der Datei)
import { initSupabasePushNotifications } from './supabase-notifications.js';

// Nach erfolgreichem Login
async function handleLogin(username, password) {
    try {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            const userId = data.user.id;

            // ✅ Push Notifications initialisieren
            await initSupabasePushNotifications(userId);

            // Speichere Token für Logout
            localStorage.setItem('device_token', '...');  // Optional
        }
    } catch (error) {
        console.error('Login failed:', error);
    }
}
```

### **Schritt 7: App neu builden** (2 Minuten)

```bash
# iOS synchronisieren
npx cap sync ios

# Xcode öffnen
npx cap open ios

# In Xcode:
# 1. Wählen Sie Ihr Development Team (Signing & Capabilities)
# 2. Verbinden Sie Ihr iPhone via USB
# 3. Wählen Sie iPhone als Target
# 4. Build & Run (⌘ + R)
```

**WICHTIG**: Push Notifications funktionieren **NUR auf physischem iPhone**!

### **Schritt 8: Test-Notification senden** (1 Minute)

```sql
-- In Supabase SQL Editor:
-- https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi/sql

-- Test-Notification erstellen
SELECT send_notification_to_user(
    1,  -- ⚠️ ÄNDERN: Ihre User-ID
    'Test Notification 🎉',
    'Dies ist eine Test Push Notification!',
    '{"test": true}'::jsonb
);

-- Queue verarbeiten
SELECT process_notification_queue();
```

**ODER via API:**

```bash
curl -X POST https://hsbjflixgavjqxvnkivi.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYmpmbGl4Z2F2anF4dm5raXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTAzOTYsImV4cCI6MjA3NDk4NjM5Nn0.voTOMgBYk_ePD4QhYJoFNmNgyewOoWDJeK1avau5UKE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "title": "Test 🎉",
    "body": "Hello from HabDaWas!"
  }'
```

---

## 🔄 Automatische Notifications einrichten

### Cron-Job für Queue Processing

**Option A: Supabase Cron (Empfohlen)**

```sql
-- In Supabase SQL Editor:
-- Extensions aktivieren
-- Dashboard → Database → Extensions → pg_cron aktivieren

-- Cron-Job erstellen (alle 5 Minuten)
SELECT cron.schedule(
    'process-notification-queue',
    '*/5 * * * *',
    $$ SELECT process_notification_queue(); $$
);
```

**Option B: Externer Cron**

```bash
# Fügen Sie in Ihrem Server crontab hinzu:
* * * * * curl -X POST https://hsbjflixgavjqxvnkivi.supabase.co/rest/v1/rpc/process_notification_queue \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## 📊 Monitoring

### Device Tokens überprüfen

```sql
-- Supabase SQL Editor
SELECT
    user_id,
    device_token,
    platform,
    last_active,
    created_at
FROM device_tokens
ORDER BY last_active DESC;
```

### Notification Logs

```sql
-- Letzte gesendete Notifications
SELECT
    title,
    body,
    status,
    sent_at
FROM notification_logs
ORDER BY sent_at DESC
LIMIT 10;

-- Failed Notifications
SELECT * FROM notification_logs
WHERE status = 'failed';
```

---

## 🚨 Troubleshooting

### Keine Device Token in DB?

1. Xcode Console öffnen (⌘ + Shift + C)
2. Nach Fehlern suchen
3. Prüfen ob Permission gewährt wurde
4. Sicherstellen dass `initSupabasePushNotifications()` aufgerufen wird

### Edge Function Fehler?

```bash
# Logs anzeigen
supabase functions logs send-push-notification

# Secrets überprüfen
supabase secrets list
```

### Notification kommt nicht an?

**Checklist:**
- [ ] Physisches iPhone (nicht Simulator!)
- [ ] Push Notifications in iOS Settings aktiviert
- [ ] Device Token in Supabase vorhanden
- [ ] Edge Function deployed
- [ ] APNs Credentials korrekt
- [ ] Queue wird verarbeitet

---

## 📁 Projektstruktur

```
iphone_app/
├── .env                                    ← ✅ Ihre Supabase Credentials
├── deploy-notifications.sh                 ← ✅ Deployment Script
├── ios/App/App/
│   └── App.entitlements                    ← ✅ iOS Push Capability
├── www/
│   └── supabase-notifications.js          ← ✅ Frontend (Credentials gesetzt!)
├── supabase/
│   ├── schema.sql                          ← 📋 TODO: In Dashboard installieren
│   ├── triggers.sql                        ← 📋 TODO: Anpassen + installieren
│   └── functions/send-push-notification/   ← 📋 TODO: Deployen
├── PUSH-NOTIFICATIONS-SETUP.md             ← 📖 Vollständige Docs
├── QUICK-START-NOTIFICATIONS.md            ← 📖 Quick Start
└── NAECHSTE-SCHRITTE.md                    ← 📖 Diese Datei
```

---

## 🎯 Zusammenfassung

### **Bereits erledigt** ✅
1. iOS App konfiguriert
2. Frontend Code geschrieben
3. Supabase Credentials eingebunden
4. Database Schema vorbereitet
5. Edge Function vorbereitet
6. Deployment Script erstellt

### **TODO für Sie** 📋
1. **Apple Developer Account** registrieren
2. **APNs Key** (.p8) erstellen
3. **Database Schema** in Supabase installieren
4. **Edge Function** deployen (mit `./deploy-notifications.sh`)
5. **Triggers** aktivieren
6. **Frontend** in beta.habdawas.at integrieren
7. **App neu builden** auf iPhone
8. **Test-Notification** senden

### **Geschätzte Zeit**: ~30 Minuten

---

## 📞 Support Links

- **Supabase Dashboard**: https://hsbjflixgavjqxvnkivi.supabase.co
- **SQL Editor**: https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi/sql
- **Apple Developer**: https://developer.apple.com/account
- **APNs Keys**: https://developer.apple.com/account/resources/authkeys/list

---

**Los geht's!** 🚀

Beginnen Sie mit **Schritt 1** (Apple Developer Account) und arbeiten Sie sich durch die Liste!
