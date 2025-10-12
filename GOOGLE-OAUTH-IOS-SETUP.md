# Google OAuth für iOS - Vollständige Setup-Anleitung

## 🎯 Problem: Fehler 400 bei iOS OAuth

**Root Cause**:
1. **PKCE doppelt**: Supabase generiert OAuth URL mit PKCE → Plugin fügt nochmal PKCE hinzu → Google sieht widersprüchliche Parameter → 400 error
2. **iOS Client fehlt**: Google braucht separaten iOS OAuth Client mit Bundle ID

**Lösung**: iOS Client erstellen + Beide Client IDs in Supabase eintragen + `pkceEnabled: false` im Code

---

## ✅ Schritt 1: Google Cloud Console - iOS Client erstellen

### 1.1 iOS OAuth Client anlegen

1. **Google Cloud Console öffnen**: https://console.cloud.google.com/
2. **Projekt auswählen**: Dein bestehendes Projekt mit dem Web-Client
3. **APIs & Services → Credentials**
4. **"+ CREATE CREDENTIALS" → "OAuth client ID"**
5. **Application type**: `iOS`
6. **Name**: `HabDaWas iOS App`
7. **Bundle ID**: `at.habdawas.app`
8. **App Store ID**: (kann leer bleiben für Development)
9. **"CREATE"** klicken

### 1.2 Client IDs notieren

Du brauchst jetzt **BEIDE** Client IDs:

**Web Client ID** (hast du schon):
```
60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com
```

**iOS Client ID** (neu erstellt):
```
<DEINE_IOS_CLIENT_ID>.apps.googleusercontent.com
```

⚠️ **WICHTIG**: Kopiere die iOS Client ID - du brauchst sie gleich!

### 1.3 Was passiert hier?

- **iOS Client**: Google erkennt native iOS Apps über Bundle ID
- **Kein Redirect URI**: iOS Clients brauchen keine "Authorized redirect URIs" in Google Console
- **Custom URL Scheme**: iOS nutzt `habdawas://` statt https:// - das ist bei Google so designed

---

## ✅ Schritt 2: Supabase - Google Provider konfigurieren

### 2.1 Beide Client IDs eintragen

1. **Supabase Dashboard öffnen**: https://supabase.com/dashboard
2. **Dein Projekt auswählen**: HabDaWas
3. **Authentication → Providers → Google**

**Client ID** (⚠️ KRITISCH!):
```
WEB_CLIENT_ID,IOS_CLIENT_ID
```

**Beispiel**:
```
60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com,<DEINE_IOS_CLIENT_ID>.apps.googleusercontent.com
```

**Wichtig**:
- ✅ Kommasepariert, **KEINE Leerzeichen**
- ✅ Web Client ID **ZUERST**, dann iOS Client ID
- ✅ Beide mit voller Domain (.apps.googleusercontent.com)

**Client Secret**:
```
<NUR_DAS_WEB_CLIENT_SECRET>
```

⚠️ **Nur das Secret des Web-Clients eintragen, nicht das iOS Secret!**

**"Save"** klicken

### 2.2 Redirect URLs konfigurieren

1. **Authentication → URL Configuration**
2. **Redirect URLs** - Diese URLs müssen eingetragen sein:

```
https://beta.habdawas.at/
https://beta.habdawas.at/auth/callback
habdawas://auth/callback
http://localhost:5173/auth/callback
```

3. **"Save"** klicken

### 2.3 Was passiert hier?

**Client IDs kommasepariert**:
- Supabase sendet beide IDs zu Google
- Google prüft: Web-Login → Web-Client, iOS-Login → iOS-Client
- Dokumentiert in Supabase Docs: "concatenate all of the client IDs with a comma but make sure the web's client ID is first"

**Redirect URLs**:
- `https://` URLs: Für Web OAuth + Universal Links
- `habdawas://` URL: Für native iOS Custom URL Scheme
- Google prüft nur die https:// URLs, iOS nutzt `habdawas://`

---

## ✅ Schritt 3: Code-Fix (bereits gemacht!)

### 3.1 pkceEnabled: false

```typescript
const result = await GenericOAuth2.authenticate({
  appId: 'habdawas',
  authorizationBaseUrl: data.url,          // ← Supabase URL hat schon PKCE!
  redirectUrl: 'habdawas://auth/callback',
  responseType: 'code',
  pkceEnabled: false,                       // ← WICHTIG: MUSS false sein!
});
```

### 3.2 Warum pkceEnabled: false?

**Problem bei pkceEnabled: true**:
1. Supabase generiert OAuth URL: `https://accounts.google.com/o/oauth2/auth?...&code_challenge=ABC&code_challenge_method=S256`
2. GenericOAuth2 Plugin fügt hinzu: `&code_challenge=XYZ&code_challenge_method=S256`
3. Google sieht: "Zwei verschiedene code_challenge Werte? 🤔 → 400 Bad Request"

**Lösung mit pkceEnabled: false**:
1. Supabase generiert OAuth URL mit PKCE
2. Plugin öffnet URL **unverändert** in ASWebAuthenticationSession
3. Google erhält saubere URL mit einem PKCE → ✅ Funktioniert

---

## ✅ Schritt 4: Build & Test

### 4.1 Production Build

```bash
cd /Users/martinmollay/Development/bazar_bold
npm run build
```

### 4.2 Build kopieren

```bash
rsync -av --delete dist/ /Users/martinmollay/Development/iphone_app/www/
```

### 4.3 Capacitor Sync

```bash
cd /Users/martinmollay/Development/iphone_app
npx cap sync ios
```

### 4.4 Test in Xcode

1. Xcode öffnen
2. iPhone Simulator oder echtes Gerät auswählen
3. App starten
4. "Mit Google anmelden" klicken
5. ASWebAuthenticationSession sollte öffnen
6. Google Account auswählen
7. App sollte sich einloggen ✅

---

## 🔍 Troubleshooting

### Problem: Immer noch Fehler 400

**Checkliste**:
- [ ] iOS Client in Google Console erstellt mit Bundle ID `at.habdawas.app`?
- [ ] Beide Client IDs kommasepariert in Supabase eingetragen?
- [ ] Web Client ID ist die **erste** in der Liste?
- [ ] Keine Leerzeichen zwischen den Client IDs?
- [ ] Nur Web Client Secret eingetragen (nicht iOS)?
- [ ] `pkceEnabled: false` im Code gesetzt?
- [ ] Production Build neu erstellt nach Code-Änderung?
- [ ] `npx cap sync ios` ausgeführt?

### Problem: USER_CANCELLED

**Das ist OK!** Das bedeutet:
- ✅ ASWebAuthenticationSession öffnet erfolgreich
- ✅ OAuth URL ist korrekt
- ✅ User hat nur auf "Abbrechen" geklickt

**Einfach nochmal versuchen und Google Account auswählen!**

### Problem: invalid_client

**Ursache**: Google findet die Client ID nicht

**Lösung**:
1. Prüfe ob iOS Client ID korrekt kopiert wurde
2. Prüfe ob Komma zwischen den IDs steht (keine Leerzeichen)
3. Warte 5 Minuten - Google braucht Zeit zum Propagieren

### Problem: redirect_uri_mismatch

**Ursache**: Redirect URL nicht in Supabase konfiguriert

**Lösung**:
1. Supabase → Authentication → URL Configuration
2. `habdawas://auth/callback` hinzufügen
3. Save klicken

---

## 📊 Vergleich: Web vs. Native

| Feature | Web OAuth | Native iOS OAuth |
|---------|-----------|------------------|
| Client Type | Web Client | iOS Client (+ Web Client) |
| Client ID in Supabase | Nur Web ID | WEB_ID,IOS_ID (kommasepariert) |
| Redirect URL | https://beta.habdawas.at/ | habdawas://auth/callback |
| Browser | System Browser | ASWebAuthenticationSession |
| PKCE | Automatisch | Bereits in Supabase URL |
| pkceEnabled | (nicht relevant) | **false** (kritisch!) |

---

## 🎯 Warum funktioniert das jetzt?

### Vorher (Fehler 400):
```
Supabase URL: accounts.google.com?...&code_challenge=ABC
                                      ↓
GenericOAuth2 (pkceEnabled: true): Fügt hinzu: &code_challenge=XYZ
                                      ↓
Google: "WTF? Zwei code_challenge? 🤨" → 400 Bad Request
```

### Nachher (funktioniert ✅):
```
Supabase URL: accounts.google.com?...&code_challenge=ABC&client_id=WEB_ID,IOS_ID
                                      ↓
GenericOAuth2 (pkceEnabled: false): Öffnet URL unverändert
                                      ↓
Google: "iOS Client ID erkannt ✅, PKCE korrekt ✅" → OAuth Dialog
                                      ↓
User wählt Account → Redirect zu habdawas://auth/callback?code=...
                                      ↓
Supabase exchangeCodeForSession(): Prüft PKCE Code Verifier ✅
                                      ↓
User eingeloggt 🎉
```

---

## 📚 Offizielle Dokumentation

### Supabase Docs:
- **Google Login Setup**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Multiple OAuth Clients**: https://supabase.com/docs/guides/auth/social-login/auth-google#using-native-sign-in-for-ios
- **Redirect URLs**: https://supabase.com/docs/guides/auth/redirect-urls
- **Native Mobile Deep Linking**: https://supabase.com/docs/guides/auth/native-mobile-deep-linking

### Google Docs:
- **OAuth for iOS**: https://developers.google.com/identity/protocols/oauth2/native-app
- **iOS Client Setup**: https://support.google.com/cloud/answer/6158849

---

## ✅ Erfolgs-Checkliste

Nach dieser Anleitung sollte funktionieren:

- [x] **Code-Fix**: `pkceEnabled: false` gesetzt
- [ ] **iOS Client**: In Google Cloud Console erstellt
- [ ] **Supabase Config**: WEB_ID,IOS_ID kommasepariert eingetragen
- [ ] **Redirect URLs**: `habdawas://auth/callback` in Supabase
- [ ] **Build**: Production Build erstellt
- [ ] **Sync**: Capacitor iOS synchronisiert
- [ ] **Test**: Google Login in iOS App funktioniert

---

**Version**: 1.0.12
**Datum**: 2025-10-12
**Status**: PKCE Fix + iOS Client Setup erforderlich

---

## 🚀 Nächste Schritte

1. **iOS Client in Google Console erstellen** (5 Minuten)
2. **Client IDs in Supabase eintragen** (2 Minuten)
3. **Production Build erstellen** (siehe Schritt 4)
4. **In Xcode testen** 🎉

**Code ist bereits gefixt!** Nur noch Google Console + Supabase konfigurieren, dann sollte OAuth funktionieren!
