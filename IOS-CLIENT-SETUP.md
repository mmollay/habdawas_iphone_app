# iOS Google OAuth Client Setup

## Problem
Web OAuth Client funktioniert nicht für native iOS Apps. iOS benötigt einen eigenen OAuth Client Type.

## Lösung: iOS Client in Google Cloud Console

### Neue Client ID
```
60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
```

---

## 1. Google Cloud Console Konfiguration

### iOS OAuth Client erstellen (✅ ERLEDIGT)

**Navigation**: APIs & Services → Credentials → Create Credentials → OAuth client ID

**Settings**:
- **Application type**: iOS
- **Name**: HabDaWas iOS App
- **Bundle ID**: `at.habdawas.app`
- **App Store ID**: (optional, leer lassen)
- **Team ID**: (optional, leer lassen)

**Client ID**:
```
60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
```

⚠️ **WICHTIG**: Bundle ID muss EXAKT mit iOS App übereinstimmen!

---

## 2. Supabase Konfiguration

### Option A: Zusätzliche Client ID (Empfohlen)

Google erlaubt mehrere Client IDs für dasselbe Projekt:
- **Web Client**: Für Web-Version
- **iOS Client**: Für iOS App

**Supabase Dashboard**:
1. Authentication → Providers → Google
2. **Client ID (for OAuth)**: Behalten: `60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com`
3. **Additional Client IDs**: Hinzufügen:
   ```
   60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
   ```

**Vorteil**: Web UND iOS funktionieren beide

### Option B: iOS Client als Haupt-Client

**Supabase Dashboard**:
1. Authentication → Providers → Google
2. **Client ID (for OAuth)** ersetzen durch:
   ```
   60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
   ```
3. Kein Client Secret erforderlich für iOS Client!

⚠️ **ACHTUNG**: Web OAuth könnte dann nicht mehr funktionieren!

---

## 3. Code-Anpassungen

### Option 1: Reversed Client ID (Google Sign-In Style)

Für iOS OAuth wird oft ein **reversed client ID** als URL Scheme verwendet:

```typescript
// In AuthContext.tsx
const signInWithGoogle = async () => {
  try {
    setOauthLoading(true);
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      // Web OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return;
    }

    // Native iOS OAuth mit iOS Client ID
    console.log('[OAuth] Starting native iOS OAuth with iOS Client...');

    // Reversed Client ID als Redirect URL
    const reversedClientId = 'com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q';
    const redirectUrl = `${reversedClientId}:/oauth2redirect`;

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

    console.log('[OAuth] Opening ASWebAuthenticationSession...');

    const result = await GenericOAuth2.authenticate({
      appId: 'habdawas',
      authorizationBaseUrl: data.url,
      redirectUrl: redirectUrl,
      responseType: 'code',
      pkceEnabled: true,
    });

    console.log('[OAuth] Got callback URL:', result.url);

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);

    if (exchangeError) {
      console.error('[OAuth] Exchange error:', exchangeError);
      setOauthLoading(false);
      throw exchangeError;
    }

    console.log('[OAuth] Success!');
    setOauthLoading(false);
  } catch (err) {
    console.error('[OAuth] Error:', err);
    setOauthLoading(false);
    throw err;
  }
};
```

### Info.plist Anpassung

**ZUSÄTZLICH** zum bestehenden `habdawas` Scheme:

```xml
<key>CFBundleURLTypes</key>
<array>
  <!-- Bestehendes Custom URL Scheme -->
  <dict>
    <key>CFBundleURLName</key>
    <string>com.habdawas.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>habdawas</string>
    </array>
  </dict>

  <!-- NEU: Google Reversed Client ID -->
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

## 4. Supabase Redirect URLs

**WICHTIG**: In Supabase die neue Redirect URL hinzufügen:

**Authentication → URL Configuration → Redirect URLs**:
```
com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q:/oauth2redirect
```

**ODER** (je nach Ansatz):
```
habdawas://auth/callback
```

---

## 5. Alternative: Universal Links beibehalten

Falls reversed Client ID nicht funktioniert, Universal Links mit iOS Client:

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://beta.habdawas.at/auth/callback',
    skipBrowserRedirect: true,
    queryParams: {
      // Force iOS Client ID
      client_id: '60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com'
    }
  },
});
```

---

## 6. Google Cloud Console: Authorized Redirect URIs

**Für iOS Client** müssen folgende Redirect URIs eingetragen sein:

**Navigation**: APIs & Services → Credentials → iOS Client → Edit

**Authorized redirect URIs**:
```
com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q:/oauth2redirect
https://beta.habdawas.at/auth/callback
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

⚠️ **WICHTIG**: Supabase Callback URL ist Pflicht!

---

## Testing-Checklist

- [ ] Bundle ID in Google Cloud Console: `at.habdawas.app` ✅
- [ ] iOS Client ID in Supabase hinzugefügt
- [ ] Reversed Client ID in Info.plist hinzugefügt
- [ ] Redirect URL in Supabase konfiguriert
- [ ] Authorized Redirect URIs in Google Cloud Console
- [ ] Code angepasst mit reversed Client ID
- [ ] Capacitor Sync durchgeführt
- [ ] App in Xcode getestet

---

## Warum iOS Client statt Web Client?

### Web Client
- ❌ Redirect URI: `https://` URLs
- ❌ Funktioniert nicht mit ASWebAuthenticationSession
- ❌ Google erwartet Browser-Umgebung

### iOS Client
- ✅ Redirect URI: Reversed Client ID Scheme
- ✅ Speziell für native iOS Apps
- ✅ Google erkennt iOS Bundle ID
- ✅ Funktioniert mit ASWebAuthenticationSession

---

## Reversed Client ID Format

**Client ID**:
```
60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q.apps.googleusercontent.com
```

**Reversed Client ID**:
```
com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q
```

**URL Scheme**:
```
com.googleusercontent.apps.60326895721-uo4pph6u9jncm9n37ldr0v246ci97l8q:/oauth2redirect
```

---

## Referenzen

- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Supabase Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Capacitor OAuth Best Practices](https://capacitorjs.com/docs/guides/deep-links)

---

**Version**: iOS Client Setup v1.0
**Datum**: 2025-10-12
