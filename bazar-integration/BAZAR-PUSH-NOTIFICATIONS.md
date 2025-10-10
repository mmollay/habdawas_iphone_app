# 📱 Bazar iOS App - Push Notifications Setup

**Check!!** - Vollständige Integration für Ihr Bazar-Projekt mit React + Supabase!

---

## 🎯 Was Sie bekommen:

**Automatische Push Notifications** für:
- ✅ Neue Inserate (Listings) → Admin bekommt Notification
- ✅ Neue Nachrichten → Empfänger bekommt Notification
- ✅ Neue Favoriten → Seller bekommt Notification
- ✅ Verkaufte Inserate → Seller bekommt Notification
- ✅ Preisreduktionen → Favoriter bekommen Notification (optional)

---

## 📂 Projekt-Struktur

Ich habe folgende Dateien für Sie erstellt:

```
bazar-integration/
├── hooks/
│   └── usePushNotifications.ts           ← React Hook für Push Notifications
├── contexts/
│   └── AuthContext-with-notifications.tsx ← Updated AuthContext
├── supabase/
│   └── bazar-triggers.sql                ← Database Triggers
└── BAZAR-PUSH-NOTIFICATIONS.md           ← Diese Datei
```

---

## 🚀 Installation in 6 Schritten

### **Schritt 1: iOS App vorbereiten** (5 Min)

```bash
# A) Capacitor Dependencies installieren
npm install @capacitor/push-notifications @capacitor/core

# B) iOS synchronisieren
npx cap sync ios

# C) In Xcode öffnen
npx cap open ios
```

**In Xcode:**
1. Wählen Sie Ihr Development Team (Signing & Capabilities)
2. Push Notifications Capability ist bereits konfiguriert ✅

### **Schritt 2: React Code integrieren** (10 Min)

#### A) Push Notification Hook kopieren

```bash
# Erstellen Sie das hooks Verzeichnis falls nicht vorhanden
mkdir -p src/hooks

# Kopieren Sie usePushNotifications.ts
cp /Users/martinmollay/Development/iphone_app/bazar-integration/hooks/usePushNotifications.ts \
   /Users/martinmollay/Development/bazar_analysis/src/hooks/
```

#### B) AuthContext ersetzen

```bash
# Backup erstellen
cp src/contexts/AuthContext.tsx src/contexts/AuthContext.tsx.backup

# Neuen AuthContext kopieren
cp /Users/martinmollay/Development/iphone_app/bazar-integration/contexts/AuthContext-with-notifications.tsx \
   src/contexts/AuthContext.tsx
```

**ODER** manuell integrieren:

```typescript
// In src/contexts/AuthContext.tsx:
import { usePushNotifications } from '../hooks/usePushNotifications';

export function AuthProvider({ children }: { children: ReactNode }) {
  // ... existing code ...

  // ✅ Add Push Notifications Hook
  const { initPushNotifications, removePushToken } = usePushNotifications();

  // ✅ Initialize after login
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user) {
      await initPushNotifications(data.user.id);  // ← Hier hinzufügen
    }

    return { error };
  };

  // ✅ Remove token on logout
  const signOut = async () => {
    await removePushToken();  // ← Hier hinzufügen
    await supabase.auth.signOut();
  };

  // ... rest of code ...
}
```

### **Schritt 3: Supabase Database Setup** (5 Min)

#### A) Device Tokens Tabellen erstellen

```sql
-- In Supabase SQL Editor ausführen
-- (https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi/sql)

-- Kopieren Sie aus: /Users/martinmollay/Development/iphone_app/supabase/schema.sql
-- Oder direkt:
```

Öffnen Sie: `/Users/martinmollay/Development/iphone_app/supabase/schema.sql`
→ Kopieren Sie ALLES
→ In Supabase SQL Editor einfügen
→ Run

#### B) Bazar Triggers installieren

```sql
-- Öffnen Sie: /Users/martinmollay/Development/iphone_app/bazar-integration/supabase/bazar-triggers.sql

-- ⚠️ WICHTIG: Zeile 23 anpassen!
admin_user_id uuid := 'YOUR_ADMIN_USER_ID'::uuid;  -- Ihre User-ID hier

-- Dann ALLES in Supabase SQL Editor einfügen
-- Run
```

**Wo finde ich meine User-ID?**
```sql
-- In Supabase SQL Editor:
SELECT id, display_name, email
FROM profiles
JOIN auth.users ON profiles.id = auth.users.id
WHERE email = 'ihre@email.com';
```

### **Schritt 4: Apple Developer Setup** (10 Min)

Falls noch nicht geschehen:

1. **Apple Developer Account** registrieren (99€/Jahr)
   → https://developer.apple.com/programs/

2. **APNs Key erstellen**:
   → https://developer.apple.com/account/resources/authkeys/list
   - Klicken Sie **+**
   - Name: `Bazar Push Notifications`
   - Aktivieren: **APNs**
   - Laden Sie die **.p8 Datei** herunter (nur 1x möglich!)
   - Notieren: **Key ID** + **Team ID**

### **Schritt 5: Edge Function deployen** (5 Min)

```bash
# A) Supabase CLI installieren (falls nicht vorhanden)
brew install supabase/tap/supabase

# B) Login
supabase login

# C) Projekt linken
cd /Users/martinmollay/Development/iphone_app
supabase link --project-ref hsbjflixgavjqxvnkivi

# D) APNs Secrets setzen
supabase secrets set APNS_KEY_ID="YOUR_KEY_ID"
supabase secrets set APNS_TEAM_ID="YOUR_TEAM_ID"
supabase secrets set APNS_KEY_P8="-----BEGIN PRIVATE KEY-----
[Ihr P8 Key Content]
-----END PRIVATE KEY-----"

# E) Edge Function deployen
supabase functions deploy send-push-notification
```

**ODER** verwenden Sie das Deployment-Script:

```bash
cd /Users/martinmollay/Development/iphone_app
./deploy-notifications.sh
```

### **Schritt 6: Testen** (5 Min)

#### A) App auf iPhone installieren

```bash
# iOS syncen
npx cap sync ios

# Xcode öffnen
npx cap open ios

# In Xcode:
# - iPhone via USB verbinden
# - iPhone als Target wählen
# - Build & Run (⌘ + R)
```

**WICHTIG**: Push Notifications funktionieren **NUR auf physischem iPhone**!

#### B) Test-Notification senden

```sql
-- In Supabase SQL Editor:
SELECT send_bazar_notification(
    'your-user-id-here'::uuid,
    'Test Notification 🎉',
    'Dies ist eine Test-Nachricht von Bazar!',
    '{"test": true}'::jsonb
);

-- Queue verarbeiten
SELECT process_notification_queue();
```

**ODER** via Edge Function:

```bash
curl -X POST https://hsbjflixgavjqxvnkivi.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "title": "Test 🎉",
    "body": "Hello from Bazar!"
  }'
```

---

## 🔥 Auto-Notifications Setup

### Cron-Job für Queue Processing

**Option A: Supabase Cron (Empfohlen)**

```sql
-- In Supabase SQL Editor:
-- 1. pg_cron Extension aktivieren (Dashboard → Database → Extensions)

-- 2. Cron-Job erstellen (alle 5 Minuten)
SELECT cron.schedule(
    'process-bazar-notification-queue',
    '*/5 * * * *',
    $$ SELECT process_notification_queue(); $$
);

-- 3. Cron-Jobs anzeigen
SELECT * FROM cron.job;
```

**Option B: Externer Cron**

```bash
# In Ihrer Server crontab:
* * * * * curl -X POST https://hsbjflixgavjqxvnkivi.supabase.co/rest/v1/rpc/process_notification_queue \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 📊 Monitoring

### Device Tokens überprüfen

```sql
-- Alle registrierten Geräte
SELECT
    dt.user_id,
    p.display_name,
    dt.platform,
    dt.last_active,
    dt.created_at
FROM device_tokens dt
JOIN profiles p ON p.id = dt.user_id
ORDER BY dt.last_active DESC;
```

### Notification Logs

```sql
-- Letzte gesendete Notifications
SELECT
    nl.title,
    nl.body,
    nl.status,
    p.display_name as user_name,
    nl.sent_at
FROM notification_logs nl
LEFT JOIN profiles p ON p.id = nl.user_id
ORDER BY nl.sent_at DESC
LIMIT 20;

-- Failed Notifications
SELECT * FROM notification_logs
WHERE status = 'failed'
ORDER BY sent_at DESC;
```

### Queue Status

```sql
-- Pending Notifications
SELECT
    nq.title,
    nq.body,
    nq.scheduled_for,
    nq.status,
    array_length(nq.user_ids, 1) as recipient_count
FROM notification_queue nq
WHERE status = 'pending'
ORDER BY scheduled_for ASC;
```

---

## 🎯 Use Cases & Beispiele

### 1. Neues Listing → Admin Notification

**Automatisch bei `INSERT` auf `listings` mit `status='active'`:**

```
Titel: "Neues Inserat"
Body: "Max Mustermann hat 'iPhone 14 Pro' für 899 € eingestellt"
Data: {
  type: 'new_listing',
  listing_id: 'uuid',
  user_id: 'uuid',
  title: 'iPhone 14 Pro',
  price: 899
}
```

### 2. Neue Nachricht → Empfänger Notification

**Automatisch bei `INSERT` auf `messages`:**

```
Titel: "Neue Nachricht"
Body: "Anna Schmidt: Ist das Produkt noch verfügbar?"
Data: {
  type: 'new_message',
  message_id: 'uuid',
  sender_id: 'uuid',
  listing_id: 'uuid'
}
```

### 3. Neuer Favorit → Seller Notification

**Automatisch bei `INSERT` auf `favorites`:**

```
Titel: "Jemand mag dein Inserat! ❤️"
Body: "Peter Müller hat 'iPhone 14 Pro' favorisiert"
Data: {
  type: 'new_favorite',
  listing_id: 'uuid',
  user_id: 'uuid'
}
```

### 4. Listing verkauft → Seller Notification

**Automatisch bei `UPDATE` auf `listings` wenn `status='sold'`:**

```
Titel: "Verkauft! 🎉"
Body: "Dein Inserat 'iPhone 14 Pro' wurde als verkauft markiert"
Data: {
  type: 'listing_sold',
  listing_id: 'uuid',
  price: 899
}
```

### 5. Preisreduktion → Favoriter Notifications (Optional)

**Automatisch bei `UPDATE` wenn `price` reduziert:**

```
Titel: "Preis reduziert! -15%"
Body: "'iPhone 14 Pro' jetzt für 764 € (vorher 899 €)"
Data: {
  type: 'price_drop',
  listing_id: 'uuid',
  old_price: 899,
  new_price: 764,
  discount_percent: 15
}
```

---

## 🧪 Testing Checklist

- [ ] **Device Token** wird in Supabase gespeichert nach Login
- [ ] **Test-Notification** über SQL funktioniert
- [ ] **Neues Listing** erstellen → Admin bekommt Notification
- [ ] **Neue Nachricht** senden → Empfänger bekommt Notification
- [ ] **Listing favorisieren** → Seller bekommt Notification
- [ ] **Listing verkaufen** → Seller bekommt Notification
- [ ] **Device Token** wird gelöscht nach Logout
- [ ] **Queue wird verarbeitet** (Cron-Job läuft)

---

## 🚨 Troubleshooting

### Device Token wird nicht gespeichert

**Check:**
```typescript
// In usePushNotifications.ts Zeile 48:
// Fügen Sie mehr Logging hinzu:
console.log('[Push] Saving token to Supabase...', {
  user_id: userId,
  token_preview: token.value.substring(0, 20)
});
```

**Prüfen:**
```sql
-- In Supabase:
SELECT * FROM device_tokens WHERE user_id = 'your-user-id';
```

### Notifications kommen nicht an

**Checklist:**
- [ ] Physisches iPhone (nicht Simulator)
- [ ] Push Permission gewährt in iOS Settings
- [ ] Device Token in Supabase vorhanden
- [ ] Edge Function deployed
- [ ] APNs Credentials korrekt gesetzt
- [ ] Queue wird verarbeitet (Cron-Job)
- [ ] Admin User-ID in Triggers gesetzt

**Debug:**
```bash
# Edge Function Logs
supabase functions logs send-push-notification

# Secrets prüfen
supabase secrets list
```

### Auth State Change Loop

Falls `initPushNotifications` zu oft aufgerufen wird:

```typescript
// In usePushNotifications.ts:
// isInitializedRef verhindert mehrfache Initialisierung
if (isInitializedRef.current) {
  console.log('[Push] Already initialized');
  return;
}
```

---

## 📁 Dateistruktur (Final)

```
bazar_bolt/
├── src/
│   ├── hooks/
│   │   └── usePushNotifications.ts      ← ✅ NEU
│   ├── contexts/
│   │   └── AuthContext.tsx              ← ✅ UPDATED
│   └── lib/
│       └── supabase.ts                  ← ✅ Existing
├── supabase/
│   ├── schema.sql                       ← Device Tokens Tables
│   └── bazar-triggers.sql               ← ✅ NEU: Bazar Triggers
└── package.json                         ← Add @capacitor/push-notifications

iphone_app/
├── ios/App/App/
│   └── App.entitlements                 ← ✅ Push Capability
├── www/
│   └── (Bazar React App hier builden)
├── supabase/
│   ├── schema.sql                       ← Device Tokens Schema
│   ├── triggers.sql                     ← Generic Triggers
│   └── functions/send-push-notification/ ← Edge Function
└── deploy-notifications.sh              ← Deployment Script
```

---

## 🎉 Zusammenfassung

### ✅ Was erstellt wurde:

1. **React Hook** (`usePushNotifications.ts`)
   - Device Token Registration
   - Notification Empfang
   - Notification Tap Handling
   - Cleanup bei Logout

2. **Updated AuthContext** (`AuthContext-with-notifications.tsx`)
   - Integration in signIn
   - Integration in signUp
   - Integration in signOut
   - Integration in onAuthStateChange

3. **Database Triggers** (`bazar-triggers.sql`)
   - Trigger für neue Listings
   - Trigger für neue Nachrichten
   - Trigger für neue Favoriten
   - Trigger für verkaufte Listings
   - Optional: Trigger für Preisreduktionen

4. **Dokumentation**
   - Setup-Anleitung
   - Testing Guide
   - Troubleshooting
   - Use Cases

### 📋 Nächste Schritte:

1. [ ] **React Code integrieren** (Schritt 2)
2. [ ] **Database Setup** (Schritt 3)
3. [ ] **Apple Developer** Key erstellen (Schritt 4)
4. [ ] **Edge Function** deployen (Schritt 5)
5. [ ] **Testen** auf iPhone (Schritt 6)
6. [ ] **Cron-Job** aktivieren
7. [ ] **Monitoring** einrichten

**Geschätzte Zeit**: ~40 Minuten

---

## 📞 Support

- **Supabase Dashboard**: https://hsbjflixgavjqxvnkivi.supabase.co
- **SQL Editor**: https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi/sql
- **Bazar Repo**: git@github.com:mmollay/bazar_bolt.git
- **iOS App**: /Users/martinmollay/Development/iphone_app

---

**Viel Erfolg mit Ihren Bazar Push Notifications!** 🚀
