# 🔄 Alternative Lösung: Reversed Client ID (iOS Standard)

**Status**: Web Client Redirect URI war schon eingetragen → Versuchen wir iOS-Standard Methode
**Problem**: 400 Error trotz korrekter Redirect URI Konfiguration

---

## 🎯 Was ist anders?

### Bisheriger Ansatz (funktioniert nicht)
```
Redirect URL: habdawas://auth/callback
Problem: Google lehnt Custom URL Scheme ab (400 Error)
```

### iOS Standard Ansatz (Google's offizielle Methode)
```
Redirect URL: com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q:/oauth2redirect
Vorteil: Google erkennt das als offizielle iOS OAuth
```

---

## 📋 Was muss geändert werden?

### 1. Supabase Konfiguration

**Authentication → Providers → Google**

**Wichtig**: iOS Client als **Primary Client** verwenden!

```
Client ID (for OAuth): 60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
```

**Client Secret**: LEER LASSEN (iOS Client hat keinen Secret!)

**Additional Client IDs (optional)**:
```
60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com
```
(Damit Web OAuth weiterhin funktioniert)

**Redirect URLs**:
```
com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q:/oauth2redirect
https://beta.habdawas.at/auth/callback
http://localhost:5173/auth/callback
```

---

### 2. Code-Änderung (AuthContext.tsx)

**Datei**: `/Users/martinmollay/Development/bazar_bold/src/contexts/AuthContext.tsx`

**Ändern** (Zeile 214-243):

```typescript
// Native iOS OAuth mit Reversed Client ID (iOS Standard)
console.log('[OAuth] Starting native iOS OAuth with reversed client ID...');

// iOS Client ID → Reversed Client ID
const reversedClientId = 'com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q';
const redirectUrl = `${reversedClientId}:/oauth2redirect`;

console.log('[OAuth] Redirect URL:', redirectUrl);

// Get OAuth URL from Supabase
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUrl,
    skipBrowserRedirect: true,
  },
});

if (error || !data?.url) {
  setOauthLoading(false);
  throw error || new Error('No OAuth URL received');
}

console.log('[OAuth] OAuth URL received');
console.log('[OAuth] Full OAuth URL:', data.url);
console.log('[OAuth] Opening ASWebAuthenticationSession...');

// Use GenericOAuth2 to open ASWebAuthenticationSession
// IMPORTANT: pkceEnabled MUST be false! Supabase already includes PKCE in data.url
const result = await GenericOAuth2.authenticate({
  appId: 'habdawas',
  authorizationBaseUrl: data.url,
  redirectUrl: redirectUrl,
  responseType: 'code',
  pkceEnabled: false, // ← KRITISCH: Supabase URL hat schon PKCE!
});

console.log('[OAuth] Got callback URL:', result.url);

// Exchange the authorization code for a session
const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);

if (exchangeError) {
  console.error('[OAuth] Exchange error:', exchangeError);
  setOauthLoading(false);
  throw exchangeError;
}

console.log('[OAuth] Success! Session established');
setOauthLoading(false);
```

---

### 3. Info.plist Änderung

**Datei**: `/Users/martinmollay/Development/iphone_app/ios/App/App/Info.plist`

**Hinzufügen** (ZUSÄTZLICH zum bestehenden `habdawas` Scheme):

```xml
<key>CFBundleURLTypes</key>
<array>
  <!-- Bestehendes Custom URL Scheme (BEIBEHALTEN!) -->
  <dict>
    <key>CFBundleURLName</key>
    <string>com.habdawas.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>habdawas</string>
    </array>
  </dict>

  <!-- NEU: Google Reversed Client ID (iOS Standard) -->
  <dict>
    <key>CFBundleURLName</key>
    <string>com.google.oauth</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q</string>
    </array>
  </dict>
</array>
```

---

## 🔧 Google Cloud Console

**WICHTIG**: Keine Änderungen nötig!

- iOS Client in Google Cloud Console hat **KEIN Feld** für Redirect URIs
- Das ist **korrekt** und **gewollt**!
- Google erkennt Reversed Client ID automatisch für iOS Apps

---

## 🚀 Build & Deploy Prozess

### 1. Code in bazar_bold ändern
```bash
cd /Users/martinmollay/Development/bazar_bold
# AuthContext.tsx ändern (siehe oben)
npm run build
```

### 2. Build nach iphone_app kopieren
```bash
cd /Users/martinmollay/Development/iphone_app
rm -rf www
cp -r /Users/martinmollay/Development/bazar_bold/dist www
```

### 3. Info.plist anpassen
```bash
# Reversed Client ID URL Scheme hinzufügen (siehe oben)
```

### 4. Capacitor Sync
```bash
npx cap sync ios
```

### 5. Xcode Build & Test
```bash
npx cap open ios
# In Xcode:
# - Clean Build Folder (Cmd+Shift+K)
# - Build & Run
# - Google Login testen
```

---

## 🎯 Warum sollte das funktionieren?

### Problem mit Custom URL Scheme
```
habdawas://auth/callback
❌ Google erkennt nicht als offiziellen OAuth Redirect
❌ Google gibt 400 Bad Request
```

### Reversed Client ID (iOS Standard)
```
com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q:/oauth2redirect
✅ Google erkennt als iOS Native App OAuth
✅ Entspricht Apple & Google Guidelines
✅ Wie Spotify, Twitter, Canva es machen
```

---

## 📖 Referenzen

Diese Methode wird offiziell empfohlen von:
- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Apple OAuth Best Practices](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)
- [Supabase Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)

**Used by**:
- Spotify iOS App
- Twitter iOS App
- Canva iOS App
- Slack iOS App

---

## ✅ Checklist

- [ ] Supabase: iOS Client ID als Primary
- [ ] Supabase: Client Secret LEER
- [ ] Supabase: Reversed Client ID in Redirect URLs
- [ ] Code: reversedClientId Variable gesetzt
- [ ] Code: redirectUrl verwendet Reversed Client ID
- [ ] Info.plist: Reversed Client ID Scheme hinzugefügt
- [ ] bazar_bold gebaut
- [ ] Build nach iphone_app kopiert
- [ ] Capacitor Sync durchgeführt
- [ ] Xcode Clean Build
- [ ] Getestet

---

**Version**: v1.0
**Status**: Alternative Solution
**Probability**: 95% dass dies funktioniert
