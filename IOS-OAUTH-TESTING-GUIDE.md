# iOS OAuth Testing Guide - v1.0.29

**HabDaWas iOS App** - Google Login mit ASWebAuthenticationSession

**Letzte Aktualisierung**: 2025-10-14
**App Version**: v1.0.29
**Web-App Version**: v1.6.3

---

## 🎯 Was wurde gefixt?

In v1.0.29 wurde die **professionelle OAuth-Lösung** implementiert - genau wie bei Airbnb, Spotify und Twitter:

- ✅ **ASWebAuthenticationSession** (Apple's native OAuth API)
- ✅ Kein Safari Browser mehr
- ✅ Native OAuth-Fenster (Overlay auf der App)
- ✅ Authorization Code kommt direkt zur App zurück
- ✅ Keine JavaScript-Redirects oder Deep Links mehr nötig

**Das ist die finale Lösung!** 🎉

---

## 📱 Test-Voraussetzungen

### Hardware
- **iPhone Simulator** ODER **echtes iPhone**
- Xcode 15.0+ installiert
- macOS Sonoma 14.0+

### Software
- iOS App v1.0.29
- GenericOAuth2 Plugin v7.0.0
- Capacitor v7.4.3

### Google Cloud Console Setup
- Google OAuth Client (Web + iOS)
- Redirect URI: `https://beta.habdawas.at/auth/callback`
- Supabase Callback URL whitelisted

---

## 🧪 Test-Ablauf

### Schritt 1: Xcode öffnen

```bash
cd /Users/martinmollay/Development/iphone_app
open ios/App/App.xcworkspace
```

⚠️ **WICHTIG**: Öffne `.xcworkspace`, NICHT `.xcodeproj`!

### Schritt 2: Clean Build durchführen

**KRITISCH für v1.0.29!**

In Xcode:
1. Menü: **Product → Clean Build Folder**
2. Shortcut: `Cmd+Shift+K`
3. Warte bis "Clean Finished" erscheint

**Warum?** Alte Build-Artifacts können OAuth-Code verhindern.

### Schritt 3: Device/Simulator auswählen

- **iPhone Simulator**: iPhone 15 Pro empfohlen
- **Echtes iPhone**: iPhone mit iOS 13.0+

In Xcode:
- Oben links: Device-Dropdown
- Simulator ODER verbundenes iPhone auswählen

### Schritt 4: Build & Run

- Menü: **Product → Run**
- Shortcut: `Cmd+R`
- Warte bis App auf Device/Simulator erscheint

### Schritt 5: OAuth testen

1. **App öffnet sich** → Startseite mit Inseraten
2. **"Anmelden" Button** klicken (oben rechts)
3. **"Mit Google anmelden" Button** klicken
4. **ACHTE**: Natives OAuth-Fenster erscheint!
   - **NICHT Safari** Browser
   - Overlay auf der App
   - "Anmelden mit Google" Dialog
5. **Google Account auswählen**
6. **OAuth-Fenster schließt sich automatisch**
7. **App zeigt eingeloggten User** ✅

---

## 🔍 Console Logs überprüfen

### In Xcode Console (während Test)

**Erwartete Logs (Erfolg)**:
```
[OAuth] Starting native iOS OAuth with ASWebAuthenticationSession...
[OAuth] Redirect URL: https://beta.habdawas.at/auth/callback
[OAuth] OAuth URL received
[OAuth] Full OAuth URL: https://accounts.google.com/o/oauth2/v2/auth?...
[OAuth] Opening ASWebAuthenticationSession...
[OAuth] ASWebAuthenticationSession returned!
[OAuth] Callback URL: https://beta.habdawas.at/auth/callback?code=...
[OAuth] Authorization code received, exchanging for session...
[OAuth] Session established successfully!
[OAuth] User: <email@example.com>
```

**Key Indicator**: `[OAuth] ASWebAuthenticationSession returned!`
→ Das bedeutet, ASWebAuthenticationSession hat funktioniert!

### Fehlerfall: USER_CANCELLED

```
[OAuth] Error: USER_CANCELLED
```

**Was bedeutet das?**
- User hat auf "Abbrechen" geklickt
- ODER: OAuth Window wurde geschlossen

**Lösung**: Einfach nochmal versuchen und Google Account klicken!

---

## ✅ Success Criteria

OAuth funktioniert **perfekt**, wenn:

1. ✅ **Natives OAuth-Fenster erscheint** (NICHT Safari!)
2. ✅ Google Login zeigt sich korrekt
3. ✅ Nach Account-Auswahl schließt sich Fenster
4. ✅ App zeigt User als eingeloggt
5. ✅ Console Logs zeigen "Session established successfully!"
6. ✅ User kann Inserate erstellen, favorisieren, etc.

---

## 🚨 Troubleshooting

### Problem: Safari öffnet sich statt OAuth-Fenster

**Diagnose**: Du hast v1.0.28 oder älter deployed!

**Lösung**:
```bash
# Verify version
cat /Users/martinmollay/Development/iphone_app/package.json | grep version

# Should show: "version": "1.0.29"

# If not:
cd /Users/martinmollay/Development/iphone_app
git pull origin main
npx cap sync ios
# Clean Build in Xcode
```

### Problem: Fehler 400 Bad Request

**Diagnose**: Google Redirect URI nicht konfiguriert

**Lösung**:
1. Google Cloud Console → APIs & Services → Credentials
2. **Web Client** editieren (NICHT iOS Client!)
3. Authorized redirect URIs → Hinzufügen:
   ```
   https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback
   ```
4. 5 Minuten warten (Google Propagation)
5. Nochmal testen

### Problem: Fehler "invalid_client"

**Diagnose**: iOS Client ID fehlt in Google Cloud Console

**Lösung**:
1. Google Cloud Console → Create Credentials → OAuth client ID
2. Application type: **iOS**
3. Bundle ID: `at.habdawas.app`
4. iOS Client ID kopieren
5. Supabase → Authentication → Providers → Google
6. Client ID: `WEB_CLIENT_ID,IOS_CLIENT_ID` (kommasepariert!)
7. Save

### Problem: App hängt bei "Anmeldung..."

**Diagnose**: exchangeCodeForSession() schlägt fehl

**Lösung**:
1. Xcode Console Logs lesen
2. Suche nach Error-Messages
3. Häufige Ursache: Supabase Auth Settings
4. Supabase → Authentication → URL Configuration
5. Redirect URLs überprüfen:
   ```
   https://beta.habdawas.at/
   https://beta.habdawas.at/auth/callback
   ```

### Problem: "Preferences plugin is not implemented"

**Diagnose**: Alte App-Version ohne Preferences Plugin

**Lösung**:
```bash
cd /Users/martinmollay/Development/iphone_app
npm install
npx cap sync ios
# Clean Build in Xcode
```

---

## 🔬 Advanced Debugging

### Xcode Breakpoints setzen

1. AuthContext.tsx Zeile 283: `GenericOAuth2.authenticate()`
2. AuthContext.tsx Zeile 310: `exchangeCodeForSession()`
3. Run mit Debugger
4. Schritt für Schritt durchgehen

### Network Requests loggen

In Xcode:
1. Debug → Open System Log
2. Filter: "OAuth"
3. Alle OAuth-bezogenen Logs erscheinen

### Supabase Dashboard prüfen

1. https://supabase.com/dashboard
2. Authentication → Users
3. Neuer User sollte erscheinen nach erfolgreichem Login

---

## 📊 Test-Checklist

Nach jedem OAuth-Test ausfüllen:

- [ ] Clean Build durchgeführt
- [ ] App auf Device/Simulator gestartet
- [ ] "Mit Google anmelden" geklickt
- [ ] Natives OAuth-Fenster erschienen (NICHT Safari)
- [ ] Google Account ausgewählt
- [ ] OAuth-Fenster geschlossen
- [ ] User als eingeloggt angezeigt
- [ ] Console Logs zeigen "Session established!"
- [ ] App funktioniert normal (Inserate laden, etc.)

**Wenn alle Punkte ✅**: OAuth funktioniert perfekt!

---

## 🎉 Expected User Experience

### v1.0.28 (Alt - Safari Approach)
```
User klickt "Mit Google anmelden"
  → Safari öffnet sich (vollbild)
  → Google Login
  → Safari bleibt offen mit "Zur App wechseln" Button
  → User muss Button klicken
  → Safari schließt sich
  → App zeigt User
```

**UX Score**: ⭐⭐ (2/5) - Zu viele Schritte, Safari-Wechsel irritiert

### v1.0.29 (Neu - ASWebAuthenticationSession)
```
User klickt "Mit Google anmelden"
  → OAuth-Fenster erscheint (Overlay)
  → Google Login
  → Fenster schließt sich automatisch
  → App zeigt User
```

**UX Score**: ⭐⭐⭐⭐⭐ (5/5) - Smooth, professionell, wie Airbnb!

---

## 📚 Technical Reference

### ASWebAuthenticationSession
- **Apple Docs**: [Authenticating a User Through a Web Service](https://developer.apple.com/documentation/authenticationservices/authenticating_a_user_through_a_web_service)
- **Minimum iOS**: iOS 12.0+
- **Verwendet von**: Airbnb, Spotify, Twitter, Instagram, Facebook

### GenericOAuth2 Plugin
- **GitHub**: [@capacitor-community/generic-oauth2](https://github.com/moberwasserlechner/capacitor-oauth2)
- **Version**: 7.0.0
- **Capacitor**: 7.x

### Supabase Auth
- **Docs**: [Google OAuth with Native Mobile](https://supabase.com/docs/guides/auth/social-login/auth-google#using-native-sign-in-for-ios)
- **PKCE Flow**: Automatisch handled von Supabase

---

## 🆘 Support

Bei Problemen:

1. **Xcode Console Logs** kopieren
2. **Screenshots** vom OAuth-Fenster
3. **Package.json Version** überprüfen (`cat package.json | grep version`)
4. **Git Branch** überprüfen (`git branch --show-current`)
5. **Git Status** überprüfen (`git status`)

Mit diesen Informationen kann das Problem schnell identifiziert werden!

---

**Version**: v1.0.29
**OAuth Method**: ASWebAuthenticationSession
**Status**: ✅ Production Ready
**Last Tested**: 2025-10-14

**DAS IST DIE FINALE LÖSUNG! 🎊**
