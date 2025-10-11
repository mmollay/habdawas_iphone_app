# Supabase Redirect URL Fix

## Problem
Nach erfolgreichem Google Login im Safari bleibt der Browser offen und die App wird nicht automatisch geöffnet.

## Ursache
Die Custom URL Scheme Redirect URL `at.habdawas.app://oauth-callback` ist in Supabase nicht konfiguriert.

## Lösung - Schritt für Schritt

### 1. Supabase Dashboard öffnen

**URL**: https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi

### 2. Authentication Einstellungen öffnen

1. Klicken Sie in der linken Sidebar auf **Authentication** (🔐)
2. Dann auf **URL Configuration**

### 3. Redirect URLs konfigurieren

Suchen Sie nach dem Feld **"Redirect URLs"** oder **"Allowed Redirect URLs"**

#### Hinzufügen der iOS App URL:

```
at.habdawas.app://oauth-callback
```

**WICHTIG**: Stellen Sie sicher, dass diese URL **exakt** so eingegeben wird:
- Kein Leerzeichen am Anfang oder Ende
- Klein geschrieben (`at.habdawas.app`, nicht `AT.HABDAWAS.APP`)
- Doppelpunkt und zwei Slashes (`://`)
- Ohne trailing slash am Ende

#### Bestehende URLs behalten:

Falls bereits URLs eingetragen sind, behalten Sie diese und fügen Sie die neue hinzu:

```
https://beta.habdawas.at
https://beta.habdawas.at/
at.habdawas.app://oauth-callback
```

### 4. Speichern

Klicken Sie auf **"Save"** oder **"Update"**

### 5. Site URL prüfen (optional)

Stellen Sie sicher, dass unter **"Site URL"** folgendes eingetragen ist:
```
https://beta.habdawas.at
```

## Testen

### Nach der Konfiguration:

1. **Xcode öffnen**:
   ```bash
   cd /Users/martinmollay/Development/iphone_app
   npx cap open ios
   ```

2. **App im Simulator starten** (⌘ + R)

3. **Google Login testen**:
   - In der App auf "Mit Google anmelden" klicken
   - Safari öffnet sich
   - Bei Google einloggen
   - **NEU**: Nach erfolgreichem Login sollte die App **automatisch** wieder geöffnet werden
   - Safari schließt sich automatisch

### Was sollte passieren:

```
1. User klickt "Mit Google anmelden"
2. Safari öffnet sich mit Google OAuth
3. User loggt sich bei Google ein
4. Google leitet zu Supabase weiter
5. ✅ Supabase leitet zu: at.habdawas.app://oauth-callback?...
6. ✅ iOS öffnet automatisch die HabDaWas App
7. ✅ App verarbeitet den OAuth-Callback
8. ✅ Safari schließt sich automatisch
9. ✅ User ist in der App eingeloggt
```

## Debugging

### Falls es immer noch nicht funktioniert:

#### 1. Console Logs prüfen

In Xcode: Öffnen Sie die Debug Area (⌘ + Shift + C) und suchen Sie nach:

```
[OAuth] Starting Google sign-in...
[OAuth] OAuth URL received: https://...
[OAuth] Opening browser with URL...
[OAuth] Browser opened successfully
```

Beim Deep Link Callback sollten Sie sehen:
```
App opened with URL: at.habdawas.app://oauth-callback#access_token=...
```

#### 2. Supabase Logs prüfen

Im Supabase Dashboard unter **Authentication → Logs** können Sie OAuth-Anfragen sehen und prüfen, ob die Redirect URL korrekt verwendet wird.

#### 3. Info.plist prüfen

Stellen Sie sicher, dass in `/Users/martinmollay/Development/iphone_app/ios/App/App/Info.plist` folgendes enthalten ist:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>at.habdawas.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>at.habdawas.app</string>
        </array>
    </dict>
</array>
```

✅ **Ist bereits korrekt konfiguriert** (siehe Info.plist Zeilen 69-79)

#### 4. Pods neu installieren

Falls Capacitor Plugins nicht richtig installiert sind:

```bash
cd /Users/martinmollay/Development/iphone_app
rm -rf ios/App/Pods
cd ios/App
pod install
cd ../..
npx cap sync ios
```

## Alternative: Web-Version testen

Um zu verifizieren, dass OAuth generell funktioniert, können Sie die Web-Version testen:

1. Öffnen Sie: https://beta.habdawas.at
2. Klicken Sie auf "Mit Google anmelden"
3. OAuth sollte im selben Tab funktionieren

Falls OAuth in der Web-Version funktioniert, liegt das Problem definitiv an der Supabase Redirect URL Konfiguration.

## Häufige Fehler

### ❌ "Redirect URL not allowed in configuration"
**Ursache**: Redirect URL ist nicht in Supabase konfiguriert
**Lösung**: Siehe Schritt 3 oben

### ❌ Browser bleibt offen nach Login
**Ursache**: Deep Link wird nicht getriggert weil Supabase nicht zur App weiterleitet
**Lösung**: Redirect URL in Supabase konfigurieren

### ❌ "The operation couldn't be completed"
**Ursache**: Info.plist URL Scheme fehlt oder ist falsch
**Lösung**: Siehe "Info.plist prüfen" oben

### ❌ App öffnet sich nicht auf physischem Device
**Ursache**: App ist nicht korrekt signiert oder URL Scheme Konflikt
**Lösung**:
1. Prüfen Sie in Xcode: Signing & Capabilities
2. Stellen Sie sicher, dass Bundle ID `at.habdawas.app` ist
3. Testen Sie mit anderem URL Scheme (z.B. `habdawasapp://oauth-callback`)

## Zusätzliche Sicherheit

### Google Cloud Console prüfen

Stellen Sie auch sicher, dass in der Google Cloud Console die Supabase Callback URL eingetragen ist:

**Authorized redirect URIs**:
```
https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback
```

Diese URL ist für **alle** OAuth-Flows nötig (Web + Native).

## Ressourcen

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [iOS Custom URL Schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)

---

**Status**: 🔴 Supabase Konfiguration erforderlich
**Priority**: HIGH
**Created**: 2025-10-11
