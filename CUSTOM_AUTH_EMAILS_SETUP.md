# Custom Auth E-Mail Setup - Vollautomatisch

✅ Die Edge Function `send-custom-auth-email` wurde erfolgreich deployed!

## 🎯 Was wurde implementiert?

- **Edge Function**: Holt automatisch deine Custom Templates aus der Datenbank
- **Template-System**: Verwendet `email_headers`, `email_footers`, und `email_templates` Tabellen
- **Platzhalter**: Ersetzt automatisch {{user_name}}, {{first_name}}, {{reset_link}}, etc.
- **E-Mail-Versand**: Via Resend API (professioneller E-Mail-Service)

---

## 📋 Schritt-für-Schritt Konfiguration

### Schritt 1: Resend Account erstellen (falls noch nicht vorhanden)

1. Gehe zu **https://resend.com**
2. Registriere dich kostenlos (100 E-Mails/Tag gratis)
3. Verifiziere deine Domain `habdawas.at` (für professionelle E-Mails)
4. Erstelle einen **API Key**:
   - Dashboard → API Keys → Create API Key
   - Name: "HabDaWas Auth Emails"
   - Kopiere den API Key (wird nur einmal angezeigt!)

### Schritt 2: Resend API Key in Supabase speichern

1. Öffne **Supabase Dashboard**: https://supabase.com/dashboard/project/hsbjflixgavjqxvnkivi
2. Gehe zu **Settings** (Zahnrad links unten) → **Edge Functions**
3. Scrolle zu **"Secrets"**
4. Klicke auf **"Add new secret"**
5. Name: `RESEND_API_KEY`
6. Value: [Dein Resend API Key einfügen]
7. Klicke **"Add secret"**

### Schritt 3: Auth Hooks aktivieren

1. Im Supabase Dashboard → **Authentication** (links im Menü)
2. Gehe zu **Hooks** (oben im Submenu)
3. Klicke auf **"Add a new hook"**

**Für jedes Event eine Hook erstellen:**

#### Hook 1: Password Reset
- **Hook name**: `password-reset-custom-email`
- **Event**: `Send Email`
- **Event type**: `Password Reset`
- **Function**: `send-custom-auth-email`
- **HTTP Method**: `POST`
- **Enabled**: ✅

#### Hook 2: Email Verification
- **Hook name**: `email-verification-custom-email`
- **Event**: `Send Email`
- **Event type**: `Email Confirmation`
- **Function**: `send-custom-auth-email`
- **HTTP Method**: `POST`
- **Enabled**: ✅

#### Hook 3: Magic Link (optional)
- **Hook name**: `magic-link-custom-email`
- **Event**: `Send Email`
- **Event type**: `Magic Link`
- **Function**: `send-custom-auth-email`
- **HTTP Method**: `POST`
- **Enabled**: ✅

#### Hook 4: Email Change (optional)
- **Hook name**: `email-change-custom-email`
- **Event**: `Send Email`
- **Event type**: `Email Change Confirmation`
- **Function**: `send-custom-auth-email`
- **HTTP Method**: `POST`
- **Enabled**: ✅

---

## ✅ Schritt 4: Testen

### Test 1: Passwort vergessen
1. Gehe zu **http://localhost:5173**
2. Klicke auf **Login** → **Passwort vergessen**
3. Gib deine E-Mail ein
4. Du solltest eine E-Mail mit deinem Custom Template erhalten!

### Test 2: Neue Registrierung
1. Registriere einen neuen Test-User
2. Du solltest die Verifizierungs-E-Mail mit deinem Custom Template erhalten

### Logs überprüfen
1. Supabase Dashboard → **Edge Functions** → **send-custom-auth-email**
2. Klicke auf **Logs** (rechts oben)
3. Hier siehst du alle E-Mail-Versand-Logs mit detaillierten Infos

---

## 🎨 Templates anpassen

Alle Templates kannst du im **Admin-Bereich** bearbeiten:

1. Gehe zu **http://localhost:5173/admin**
2. Navigiere zu **"Email-Templates"**
3. Bearbeite Header, Footer oder Templates nach Belieben
4. **Änderungen werden sofort aktiv!** (Kein manuelles Kopieren mehr nötig)

### Verfügbare Template-Typen:
- `password_reset` - Passwort zurücksetzen
- `email_verification` - E-Mail Verifizierung
- `welcome` - Willkommens-E-Mail (optional, manuell versendbar)

### Verfügbare Platzhalter:
- `{{user_name}}` - Vollständiger Name des Users
- `{{first_name}}` - Vorname
- `{{email}}` - E-Mail-Adresse
- `{{reset_link}}` - Link zum Passwort zurücksetzen
- `{{verification_link}}` - Link zur E-Mail-Verifizierung
- `{{confirmation_url}}` - Generischer Bestätigungs-Link
- `{{site_url}}` - Hauptseite (z.B. https://habdawas.at)
- `{{unsubscribe_link}}` - Link zu den Einstellungen

---

## 🐛 Troubleshooting

### Problem: E-Mails kommen nicht an
**Lösung:**
1. Checke Resend Dashboard → **Emails** → Siehe Status
2. Schaue in Supabase Logs (Edge Functions → send-custom-auth-email)
3. Prüfe SPAM-Ordner

### Problem: "RESEND_API_KEY not configured"
**Lösung:**
1. Stelle sicher, dass der Secret korrekt gespeichert ist
2. Deploye die Function neu: `supabase functions deploy send-custom-auth-email`
3. Warte 1-2 Minuten (Secrets brauchen Zeit zum Aktivieren)

### Problem: Template nicht gefunden
**Lösung:**
1. Gehe zu Admin → Email-Templates
2. Stelle sicher, dass Templates mit korrekten `type` Werten existieren:
   - `password_reset`
   - `email_verification`
3. Checke, dass Templates auf **"Aktiv"** gesetzt sind

### Problem: Platzhalter werden nicht ersetzt
**Lösung:**
1. Stelle sicher, dass Platzhalter korrekt geschrieben sind: `{{user_name}}` (mit 2 geschweiften Klammern)
2. Checke, dass Header/Footer IDs korrekt mit dem Template verknüpft sind

---

## 📊 Monitoring

### Resend Dashboard
- **Emails**: https://resend.com/emails
- Siehe alle versendeten E-Mails
- Status, Öffnungsraten, Klickraten
- Bounce/Spam Reports

### Supabase Logs
- **Edge Functions**: https://supabase.com/dashboard/project/hsbjflixgavjqxvnkivi/functions/send-custom-auth-email/logs
- Detaillierte Logs jedes E-Mail-Versands
- Error Messages und Stack Traces

---

## 🎉 Vorteile dieser Lösung

✅ **Vollautomatisch** - Keine manuellen Template-Updates mehr
✅ **Zentral verwaltet** - Alle Templates in der Datenbank
✅ **Sofort aktiv** - Änderungen werden sofort verwendet
✅ **Professionell** - Resend garantiert hohe Zustellraten
✅ **Tracking** - Öffnungs- und Klickraten verfügbar
✅ **Branding** - Konsistentes HabDaWas Design in allen E-Mails

---

## 📝 Nächste Schritte

1. ✅ Resend Account erstellen und API Key hinterlegen
2. ✅ Auth Hooks im Supabase Dashboard konfigurieren
3. ✅ Templates im Admin-Bereich anpassen
4. ✅ Testen mit "Passwort vergessen"
5. 🎨 Optional: Weitere Templates erstellen (welcome, etc.)

---

**Deployment erfolgreich! 🚀**

Bei Fragen oder Problemen, schaue in die Logs oder kontaktiere den Support.
