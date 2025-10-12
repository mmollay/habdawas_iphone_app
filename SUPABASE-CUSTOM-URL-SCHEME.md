# Supabase Custom URL Scheme Konfiguration

## 🎯 Problem gelöst: USER_CANCELLED ist Fortschritt!

Der Fehler `USER_CANCELLED` bedeutet, dass **ASWebAuthenticationSession erfolgreich geöffnet wurde**! 🎉

Das native iOS OAuth-Fenster erscheint korrekt. Jetzt müssen wir nur noch die Custom URL Scheme Redirect URL in Supabase konfigurieren.

---

## ✅ Schnellstart (2 Minuten)

1. **Supabase Dashboard öffnen**: https://supabase.com/dashboard
2. **Projekt auswählen**: HabDaWas
3. **Authentication → URL Configuration** öffnen
4. **Redirect URLs** hinzufügen:
   ```
   habdawas://auth/callback
   ```
5. **Save** klicken
6. **iPhone App testen**: Google Login sollte jetzt funktionieren!

---

## 📋 Detaillierte Anleitung

### Schritt 1: Supabase Dashboard öffnen

```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration
```

Ersetze `YOUR_PROJECT_ID` mit deiner Projekt-ID.

### Schritt 2: Redirect URLs Sektion finden

1. Navigation: **Authentication** (linke Sidebar)
2. Tab: **URL Configuration**
3. Sektion: **Redirect URLs**

### Schritt 3: Custom URL Scheme hinzufügen

**URL hinzufügen**:
```
habdawas://auth/callback
```

**Wichtig**:
- Genau diese URL verwenden (keine Variationen!)
- Keine Leerzeichen vor/nach der URL
- Format: `habdawas://auth/callback` (mit zwei Slashes nach `:`)

### Schritt 4: Bestehende URLs behalten

Die folgenden URLs sollten bereits konfiguriert sein (nicht löschen!):

```
https://beta.habdawas.at/auth/callback
capacitor://localhost/auth/callback
http://localhost:5173/auth/callback
https://beta.habdawas.at/
```

### Schritt 5: Speichern und Testen

1. **Save** Button klicken
2. iPhone App neu starten (falls offen)
3. **Google Login testen**:
   - App öffnen
   - "Mit Google anmelden" klicken
   - ASWebAuthenticationSession sollte öffnen
   - Google Account auswählen
   - App sollte sich automatisch einloggen ✅

---

## 🔍 Was passiert technisch?

### OAuth Flow mit Custom URL Scheme:

1. **App startet OAuth**:
   ```typescript
   GenericOAuth2.authenticate({
     appId: 'habdawas',
     authorizationBaseUrl: '<GOOGLE_OAUTH_URL>',
     redirectUrl: 'habdawas://auth/callback',
     responseType: 'code',
     pkceEnabled: true,
   })
   ```

2. **ASWebAuthenticationSession öffnet**:
   - Natives iOS OAuth-Fenster (kein WebView!)
   - User sieht echten Safari-Dialog
   - Google akzeptiert diesen als "nativen Browser"

3. **User authentifiziert sich**:
   - Google Account auswählen
   - Permissions bestätigen
   - Google redirected zu: `habdawas://auth/callback?code=XXX`

4. **iOS öffnet App automatisch**:
   - Custom URL Scheme `habdawas://` ist registriert
   - iOS erkennt die URL und öffnet unsere App
   - App erhält die Callback-URL mit Authorization Code

5. **App tauscht Code gegen Session**:
   ```typescript
   supabase.auth.exchangeCodeForSession(result.url)
   ```

6. **User ist eingeloggt** ✅

---

## 🛠️ Troubleshooting

### Problem: "USER_CANCELLED" erscheint immer noch

**Ursache**: Redirect URL noch nicht in Supabase hinzugefügt

**Lösung**:
1. Prüfen ob `habdawas://auth/callback` wirklich in Supabase eingetragen ist
2. Save Button geklickt?
3. Browser-Cache leeren und neu versuchen

### Problem: "invalid_request: redirect_uri_mismatch"

**Ursache**: URL in Supabase stimmt nicht exakt mit Code überein

**Lösung**:
- Exakte URL verwenden: `habdawas://auth/callback`
- Keine Groß-/Kleinschreibung ändern
- Keine zusätzlichen Pfade oder Parameter

### Problem: OAuth-Fenster öffnet nicht

**Ursache**: GenericOAuth2 Plugin nicht korrekt installiert

**Lösung**:
```bash
cd /Users/martinmollay/Development/iphone_app
npx cap sync ios
```

### Problem: App öffnet sich nicht nach Google Login

**Ursache**: Custom URL Scheme nicht in Info.plist registriert

**Lösung**: Prüfen ob in `Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.habdawas.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>habdawas</string>
    </array>
  </dict>
</array>
```

**Status**: ✅ Bereits konfiguriert!

---

## 🎯 Warum Custom URL Scheme die Lösung ist

### ❌ Was NICHT funktioniert:

| Redirect URL | Problem |
|-------------|---------|
| `capacitor://localhost` | Google blockiert (invalid URL scheme) |
| `https://beta.habdawas.at` | 403 Disallowed_useragent (WebView blockiert) |

### ✅ Was FUNKTIONIERT:

| Redirect URL | Vorteil |
|-------------|---------|
| `habdawas://auth/callback` | ✅ Native iOS Custom URL Scheme<br>✅ ASWebAuthenticationSession akzeptiert<br>✅ Google akzeptiert<br>✅ App öffnet automatisch<br>✅ PKCE OAuth Flow sicher |

---

## 📊 Vergleich: Vorher vs. Nachher

### Vorher (v1.0.9): Universal Links

```typescript
redirectTo: 'https://beta.habdawas.at/auth/callback'
```

**Problem**:
- Safari WebView wurde verwendet
- Google blockiert mit "403 Disallowed_useragent"
- Keine native OAuth-Experience

### Nachher (v1.0.11): Custom URL Scheme

```typescript
redirectTo: 'habdawas://auth/callback'
```

**Vorteil**:
- ASWebAuthenticationSession (natives OAuth-Fenster)
- Google akzeptiert als nativen Browser
- Echte iOS OAuth-Experience wie Spotify/Twitter
- App öffnet sich automatisch nach Login

---

## ✅ Checkliste

- [ ] Supabase Dashboard geöffnet
- [ ] Authentication → URL Configuration aufgerufen
- [ ] `habdawas://auth/callback` zu Redirect URLs hinzugefügt
- [ ] Save Button geklickt
- [ ] iPhone App neu gestartet
- [ ] Google Login getestet
- [ ] User erfolgreich eingeloggt

---

## 🚀 Nach erfolgreicher Konfiguration

Wenn alles funktioniert:

1. **Testing dokumentieren**:
   - OAuth Flow erfolgreich getestet ✅
   - ASWebAuthenticationSession funktioniert ✅
   - Custom URL Scheme callback funktioniert ✅

2. **Feedback**:
   - Funktioniert der Login jetzt?
   - Gibt es noch Fehler?

---

## 📚 Weitere Ressourcen

- **Supabase OAuth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Apple OAuth Docs**: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
- **Custom URL Schemes**: https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app

---

**Version**: 1.0.11
**Datum**: 2025-10-12
**Status**: USER_CANCELLED Fix - Supabase Konfiguration erforderlich
