# Google Login Setup für iOS App

Vollständige Implementierung des Google OAuth Login für die HabDaWas iOS App.

## ✅ Was wurde implementiert

### 1. Capacitor Plugins installiert
- `@capacitor/browser` - Öffnet OAuth im nativen Safari Browser
- `@capacitor/app` - Handhabt Deep Links zurück zur App

### 2. AuthContext angepasst (bazar_bold Projekt)
- **Platform Detection**: Erkennt ob App in Capacitor läuft
- **Native Browser OAuth**: Öffnet Google Login im Safari statt WebView
- **Deep Link Handling**: Fängt OAuth Callback ab und verarbeitet ihn
- **Automatisches Browser-Schließen**: Nach erfolgreicher Authentifizierung

**Datei**: `/Users/martinmollay/Development/bazar_bold/src/contexts/AuthContext.tsx`

### 3. iOS URL Scheme konfiguriert
- **Custom URL Scheme**: `at.habdawas.app://`
- **OAuth Callback URL**: `at.habdawas.app://oauth-callback`
- **Info.plist**: CFBundleURLTypes hinzugefügt

**Datei**: `/Users/martinmollay/Development/iphone_app/ios/App/App/Info.plist`

### 4. Build & Sync
- bazar_bold neu gebaut mit Capacitor-Support
- Build nach `iphone_app/www/` kopiert
- iOS Native Code mit `npx cap sync ios` aktualisiert

## 🔧 Was noch zu tun ist

### 1. Supabase Redirect URL konfigurieren

Gehe zu deinem Supabase Dashboard:

1. **Supabase Dashboard öffnen**: https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi
2. **Authentication → URL Configuration**
3. **Redirect URLs hinzufügen**:
   ```
   at.habdawas.app://oauth-callback
   ```
4. **Site URL** (optional, wenn noch nicht gesetzt):
   ```
   https://beta.habdawas.at
   ```

### 2. Google Cloud Console Konfiguration

Falls noch nicht geschehen, stelle sicher dass deine OAuth-Credentials korrekt sind:

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **APIs & Services → Credentials**
3. **Dein OAuth 2.0 Client**
4. **Authorized redirect URIs** sollte enthalten:
   ```
   https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback
   ```

## 🧪 Testen

### 1. Im Simulator testen

```bash
npx cap open ios
```

In Xcode:
1. Wähle einen Simulator (z.B. iPhone 15 Pro)
2. Build & Run (`⌘ + R`)
3. In der App auf "Mit Google anmelden" klicken
4. Safari öffnet sich mit Google Login
5. Nach Login sollte die App automatisch wieder öffnen

### 2. Auf physischem iPhone testen

1. iPhone mit Kabel verbinden
2. In Xcode: iPhone als Target wählen
3. Build & Run
4. Bei erster Ausführung: App in Einstellungen vertrauen

### 3. Debugging

#### Console Logs prüfen
In Xcode: `⌘ + Shift + C` - Debug Area öffnen

#### Häufige Probleme

**Problem**: "Redirect URL not allowed"
- **Lösung**: Überprüfe Supabase Redirect URLs (siehe oben)

**Problem**: Browser öffnet sich nicht
- **Lösung**:
  ```bash
  cd ios/App
  pod install
  cd ../..
  npx cap sync ios
  ```

**Problem**: App öffnet sich nicht nach Login
- **Lösung**: Überprüfe Info.plist CFBundleURLTypes
- **Lösung**: Stelle sicher dass URL Scheme `at.habdawas.app` ist

## 📝 Code-Erklärung

### Platform Detection

```typescript
const isNative = Capacitor.isNativePlatform();
```

Erkennt ob die App in Capacitor (iOS/Android) oder im Browser läuft.

### OAuth mit Native Browser

```typescript
const redirectTo = isNative
  ? 'at.habdawas.app://oauth-callback'
  : `${window.location.origin}/`;

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo,
    skipBrowserRedirect: isNative,
  },
});

if (isNative && data?.url) {
  await Browser.open({
    url: data.url,
    windowName: '_self',
  });
}
```

- **Web**: Normale OAuth im selben Browser-Tab
- **Native**: Öffnet Safari, verhindert WebView-Redirect

### Deep Link Handling

```typescript
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  const handleDeepLink = async (url: string) => {
    if (url.includes('#access_token') || url.includes('?code=')) {
      const urlObj = new URL(url);
      const hash = urlObj.hash || '';
      const search = urlObj.search || '';

      await supabase.auth.getSessionFromUrl({
        url: `${window.location.origin}${hash}${search}`
      });

      await Browser.close();
    }
  };

  const listener = App.addListener('appUrlOpen', (data) => {
    handleDeepLink(data.url);
  });

  return () => {
    listener.then(l => l.remove());
  };
}, []);
```

1. App registriert Deep Link Listener
2. iOS ruft App mit `at.habdawas.app://oauth-callback#access_token=...` auf
3. App extrahiert Token und authentifiziert User
4. Safari wird automatisch geschlossen

## 🔐 Sicherheit

### URL Scheme ist App-Specific
- Nur deine App mit Bundle ID `at.habdawas.app` kann diesen Scheme verwenden
- Andere Apps können den Callback nicht abfangen

### Token-Handling
- Supabase Tokens werden sicher in localStorage gespeichert
- Keine sensiblen Daten in der URL nach Processing

### HTTPS Enforcement
- Alle API-Calls über HTTPS
- App Transport Security in Info.plist konfiguriert

## 📚 Weiterführende Dokumentation

- [Capacitor Browser Plugin](https://capacitorjs.com/docs/apis/browser)
- [Capacitor App Plugin](https://capacitorjs.com/docs/apis/app)
- [Supabase OAuth](https://supabase.com/docs/guides/auth/social-login)
- [iOS Custom URL Schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)

## 🐛 Bekannte Einschränkungen

- **Simulator iOS 17.0+**: Deep Links funktionieren nicht immer zuverlässig
- **Workaround**: Teste auf physischem Device
- **Google Sandbox**: Im Development Mode zeigt Google Warnung bei OAuth

## 📞 Support

Bei Problemen:
1. Console Logs in Xcode prüfen
2. Supabase Dashboard Logs checken
3. Stelle sicher dass alle Redirect URLs korrekt sind

---

**Version**: 1.0.2
**Zuletzt aktualisiert**: 2025-10-11
**Status**: ✅ Implementiert, Supabase Config ausstehend
