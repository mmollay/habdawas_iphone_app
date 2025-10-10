# 🚀 Quick Start: Push Notifications in 15 Minuten

**Check!!** - Schnellstart für HabDaWas Push Notifications mit Supabase

---

## ⚡ TL;DR - Was Sie brauchen

```
✅ Apple Developer Account (99€/Jahr)
✅ Supabase Account (haben Sie bereits)
✅ 15 Minuten Zeit
```

---

## 📝 In 5 Schritten zu Push Notifications

### 1️⃣ Apple APNs Key erstellen (3 Minuten)

1. https://developer.apple.com/account/resources/authkeys/list
2. **+** → Name: `HabDaWas Push` → **APNs** aktivieren
3. **.p8 Datei** herunterladen
4. Notieren: **Key ID** + **Team ID**

### 2️⃣ Supabase Setup (5 Minuten)

```bash
# A) Database Schema installieren
# → Öffnen Sie supabase/schema.sql
# → Kopieren in Supabase SQL Editor
# → Run

# B) Edge Function deployen
supabase login
cd /Users/martinmollay/Development/iphone_app
supabase link --project-ref YOUR_PROJECT
supabase secrets set APNS_KEY_ID="your-key-id"
supabase secrets set APNS_TEAM_ID="your-team-id"
supabase secrets set APNS_KEY_P8="-----BEGIN PRIVATE KEY-----..."
supabase functions deploy send-push-notification
```

### 3️⃣ Frontend integrieren (3 Minuten)

```javascript
// In www/supabase-notifications.js:
// Zeile 8-9 ändern:
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

```javascript
// In beta.habdawas.at nach Login einfügen:
import { initSupabasePushNotifications } from './supabase-notifications.js';

// Nach erfolgreichem Login:
const userId = 123;  // Ihre User-ID
initSupabasePushNotifications(userId);
```

### 4️⃣ App neu builden (2 Minuten)

```bash
npx cap sync ios
npx cap open ios

# In Xcode: Build & Run auf physischem iPhone
```

### 5️⃣ Test senden (2 Minuten)

```sql
-- In Supabase SQL Editor:
SELECT send_notification_to_user(
    1,  -- Ihre User-ID
    'Test 🎉',
    'Hello from HabDaWas!',
    '{}'::jsonb
);

SELECT process_notification_queue();
```

**🎉 Fertig!** Sie sollten jetzt eine Notification auf Ihrem iPhone sehen!

---

## 🔥 Auto-Notifications bei neuen Produkten

```sql
-- In Supabase SQL Editor triggers.sql öffnen
-- Zeile 27 ändern: admin_user_id BIGINT := 1;  -- Ihre User-ID
-- Kommentare bei CREATE TRIGGER entfernen
-- Run

-- Jetzt bekommen Sie automatisch eine Notification
-- wenn jemand ein Produkt einstellt!
```

---

## 📂 Dateien-Übersicht

```
iphone_app/
├── ios/App/App/
│   └── App.entitlements          ← iOS Push Capability
├── www/
│   └── supabase-notifications.js ← Frontend Integration
├── supabase/
│   ├── schema.sql                ← Database Schema
│   ├── triggers.sql              ← Auto-Triggers
│   └── functions/
│       └── send-push-notification/
│           └── index.ts          ← Edge Function
├── PUSH-NOTIFICATIONS-SETUP.md   ← Vollständige Anleitung
└── QUICK-START-NOTIFICATIONS.md  ← Diese Datei
```

---

## 🐛 Häufige Probleme

### Keine Notification erhalten?

```bash
# 1. Device Token in DB?
# Supabase SQL Editor:
SELECT * FROM device_tokens WHERE user_id = 1;

# 2. Edge Function Logs
supabase functions logs send-push-notification

# 3. Queue Status
SELECT * FROM notification_queue WHERE status = 'failed';
```

### APNs Fehler?

- **BadDeviceToken**: Falsches Environment (dev vs prod)
- **MissingTopic**: Bundle ID falsch
- **Unauthorized**: APNs Credentials falsch

---

## 📚 Weitere Infos

- **Vollständige Anleitung**: `PUSH-NOTIFICATIONS-SETUP.md`
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **APNs Docs**: https://developer.apple.com/documentation/usernotifications

---

**Viel Erfolg!** 🚀
