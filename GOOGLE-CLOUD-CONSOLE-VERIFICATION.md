# Google Cloud Console Verification Checklist

**Datum**: 2025-10-12
**Problem**: 400 Error bei Google OAuth trotz korrekter Supabase Konfiguration

---

## 🔍 KRITISCH: Web Client Redirect URIs

Das ist mit **90% Wahrscheinlichkeit** die Ursache des 400 Fehlers!

### Navigation
1. Google Cloud Console öffnen: https://console.cloud.google.com
2. **APIs & Services** → **Credentials**
3. **WEB Client** auswählen (NICHT iOS Client!)
   - Name sollte sein: "Web client 1" oder ähnlich
   - Client ID: `60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com`

### Erforderliche Authorized redirect URIs

Im **WEB Client** müssen folgende URIs vorhanden sein:

```
https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback
```

**Zusätzlich optional** (für lokale Tests):
```
http://localhost:5173/auth/callback
https://beta.habdawas.at/auth/callback
```

### ⚠️ WICHTIG

- Diese URL muss im **WEB Client** sein, nicht im iOS Client!
- iOS Client hat KEIN Feld für Redirect URIs (das ist normal)
- Der OAuth Flow läuft: App → Supabase → **Google (prüft Web Client URIs)** → Supabase → App

---

## ✅ Supabase Konfiguration (bereits erledigt)

Du hast bereits bestätigt, dass folgende Konfiguration korrekt ist:

### Authentication → Providers → Google

**Client ID (for OAuth)**:
```
60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com
```

**Additional Client IDs (allowed)** (komma-separiert):
```
60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
```

**ODER beide komma-separiert in einem Feld**:
```
60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com,60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
```

### Authentication → URL Configuration

**Redirect URLs** sollten enthalten:
```
habdawas://auth/callback
https://beta.habdawas.at/auth/callback
http://localhost:5173/auth/callback
```

---

## 🔐 OAuth Consent Screen

### Navigation
Google Cloud Console → **APIs & Services** → **OAuth consent screen**

### Erforderliche Einstellungen

**Publishing status**:
- Wenn "Testing" → **Test users** müssen deine E-Mail Adresse enthalten!
- Wenn "In production" → Keine Test-User erforderlich

**Scopes**:
Mindestens diese Scopes sollten aktiviert sein:
```
.../auth/userinfo.email
.../auth/userinfo.profile
openid
```

---

## 🎯 Fehlerbehebung nach Priorität

### 1. HÖCHSTE PRIORITÄT: Web Client Redirect URI

**Problem**: 400 Error bedeutet Google lehnt die redirect_uri ab

**Lösung**:
1. Google Cloud Console → Credentials → **Web Client** (nicht iOS!)
2. Edit → Authorized redirect URIs
3. Hinzufügen: `https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback`
4. Save

**Wartezeit**: Nach dem Speichern 5-10 Minuten warten (Google Propagation)

### 2. OAuth Consent Screen Test Users

**Problem**: Wenn Consent Screen im "Testing" Modus ist, nur Test Users können sich anmelden

**Lösung**:
1. OAuth consent screen → Test users
2. Deine E-Mail hinzufügen
3. Save

### 3. Client IDs Reihenfolge in Supabase

**Aktuell hast du** (bestätigt):
```
60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com,60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
```

**Alternative** (falls oben nicht funktioniert):
```
60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com,60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com
```

---

## 🧪 Testing nach Änderungen

1. **Google Cloud Console Änderungen speichern**
2. **5-10 Minuten warten** (Google Propagation!)
3. **App neu starten** (nicht nur reload)
4. **Xcode → Clean Build Folder** (Cmd+Shift+K)
5. **Neu builden und testen**

---

## 📊 Debug Informationen

### Aktuelle OAuth URL (aus deinen Logs):
```
https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/authorize?provider=google&redirect_to=habdawas%3A%2F%2Fauth%2Fcallback&code_challenge=viAvU5Jvl1KSU3-WSWxK6qXxhmJB7VOkELpM0NNBXNc&code_challenge_method=s256
```

### OAuth Flow Analyse:

1. ✅ App ruft Supabase auf
2. ✅ Supabase generiert OAuth URL mit PKCE
3. ✅ ASWebAuthenticationSession öffnet sich
4. ❌ **Google gibt 400 zurück** → redirect_uri wird abgelehnt
5. ❌ Flow stoppt hier

### Warum 400 Error?

Google prüft bei der Supabase → Google Weiterleitung:
- Ist die `redirect_uri` (`https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback`) im **Web Client** erlaubt?
- Wenn **NEIN** → 400 Error
- Wenn **JA** → OAuth Dialog erscheint

---

## 🎬 Nächste Schritte

### Schritt 1: Web Client Redirect URI prüfen
```bash
# Google Cloud Console
# → APIs & Services
# → Credentials
# → Web Client (60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1)
# → Edit
# → Authorized redirect URIs
# → Muss enthalten: https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback
```

### Schritt 2: OAuth Consent Screen Test User prüfen
```bash
# Google Cloud Console
# → APIs & Services
# → OAuth consent screen
# → Test users
# → Deine E-Mail muss gelistet sein (falls Status = Testing)
```

### Schritt 3: Nach Änderungen testen
```bash
# 5-10 Minuten warten
# App komplett neu starten
# In Xcode: Clean Build Folder
# Neu builden
# Testen
```

---

## 📝 Checklist für dich

- [ ] **Web Client** in Google Cloud Console gefunden
- [ ] **Authorized redirect URIs** Abschnitt geöffnet
- [ ] **Supabase Callback URL** (`https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback`) hinzugefügt
- [ ] **Gespeichert**
- [ ] **OAuth Consent Screen** → Test users geprüft
- [ ] **Deine E-Mail** als Test User hinzugefügt (falls Testing Mode)
- [ ] **5-10 Minuten gewartet**
- [ ] **App neu gestartet**
- [ ] **Xcode Clean Build** durchgeführt
- [ ] **Neu gebaut und getestet**

---

## 🆘 Falls es immer noch nicht funktioniert

Wenn nach allen obigen Schritten der 400 Error bleibt:

### Debug Informationen sammeln:
1. Screenshot vom **Web Client** mit allen Redirect URIs
2. Screenshot vom **OAuth Consent Screen** → Test users
3. Screenshot von **Supabase** → Google Provider Konfiguration
4. **Xcode Console Logs** vom OAuth Versuch

### Alternative: iOS Client als Primär-Client

Falls Web Client Approach nicht funktioniert, können wir umstellen auf:
- iOS Client als primary Client ID in Supabase
- Reversed Client ID URL Scheme (`com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q`)
- Siehe: IOS-CLIENT-SETUP.md für Details

---

**Wichtigste Erkenntnis**: Der 400 Error kommt von Google, nicht von der App. Google sagt "Diese redirect_uri ist nicht erlaubt". Die redirect_uri kommt von Supabase. Also muss die Supabase URL im Google Web Client whitelisted sein!

**Version**: v1.0
**Status**: Waiting for Google Cloud Console Verification
