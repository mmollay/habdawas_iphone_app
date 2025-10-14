# Xcode Setup mit Apple Developer Account - Google OAuth Universal Links

## Übersicht

Mit deinem neuen Apple Developer Account ($99/Jahr) können wir jetzt **Universal Links** aktivieren, damit Google OAuth nahtlos in der iOS-App funktioniert.

## Voraussetzungen

✅ **Bereits erledigt:**
- Apple Developer Account registriert
- Team ID: `G5QYXZ4B6L`
- App ID: `at.habdawas.app`
- AASA-Datei deployed auf `https://beta.habdawas.at/.well-known/apple-app-site-association`
- Entitlements-Datei konfiguriert mit Associated Domains
- Xcode Projekt mit Team ID konfiguriert

## Schritt 1: Xcode öffnen und Projekt laden

```bash
cd /Users/martinmollay/Development/iphone_app
open ios/App/App.xcworkspace
```

**WICHTIG:** Öffne die `.xcworkspace` Datei, NICHT die `.xcodeproj`!

## Schritt 2: Apple Developer Account in Xcode hinzufügen

1. Öffne **Xcode → Settings** (oder **Xcode → Preferences** in älteren Versionen)
2. Gehe zu **Accounts**
3. Klicke auf das **+** Symbol unten links
4. Wähle **Apple ID**
5. Logge dich mit dem Apple Developer Account ein
6. Verifiziere, dass das Team **"Martin Mollay (G5QYXZ4B6L)"** angezeigt wird

## Schritt 3: Signing & Capabilities konfigurieren

1. Wähle im Projektnavigator (links) das Projekt **"App"** aus
2. Wähle das Target **"App"** aus
3. Gehe zum Tab **"Signing & Capabilities"**

### 3.1 Automatic Signing aktivieren

- ✅ **Automatically manage signing** aktivieren
- **Team:** Wähle **"Martin Mollay (G5QYXZ4B6L)"** aus
- **Bundle Identifier:** Sollte bereits `at.habdawas.app` sein

### 3.2 Associated Domains Capability hinzufügen

**Wenn Associated Domains noch NICHT vorhanden ist:**

1. Klicke auf **"+ Capability"** oben links
2. Suche nach **"Associated Domains"**
3. Doppelklick auf **"Associated Domains"** um es hinzuzufügen

**Associated Domains konfigurieren:**

Die folgenden Domains sollten bereits in der Entitlements-Datei sein:
- `applinks:beta.habdawas.at`
- `applinks:www.habdawas.at` (für zukünftige Verwendung)

**Falls die Domains nicht angezeigt werden:**
1. Klicke auf **"+"** unter Associated Domains
2. Gib ein: `applinks:beta.habdawas.at`
3. Klicke nochmal auf **"+"**
4. Gib ein: `applinks:www.habdawas.at`

### 3.3 Push Notifications Capability überprüfen

- Sollte bereits vorhanden sein (für `aps-environment: development`)
- Falls nicht, füge es über **"+ Capability"** hinzu

## Schritt 4: Entitlements-Datei im Xcode Projekt verlinken

**WICHTIG:** Die Entitlements-Datei existiert bereits, muss aber dem Xcode Projekt bekannt gemacht werden.

1. Im Projektnavigator, suche nach der Datei `App.entitlements`
2. Falls **NICHT sichtbar**:
   - Rechtsklick auf den Ordner "App" → **Add Files to "App"...**
   - Navigiere zu: `ios/App/App/App.entitlements`
   - **WICHTIG:** Wähle **"Copy items if needed"** ab (Häkchen entfernen!)
   - **Target Membership:** Häkchen bei "App" setzen
   - Klicke auf **Add**

3. Gehe zurück zu **Signing & Capabilities**
4. Überprüfe, dass unter **Code Signing Entitlements** der Pfad steht:
   - `App/App.entitlements`

## Schritt 5: Build Configuration überprüfen

1. Gehe zu **Build Settings**
2. Suche nach **"Code Signing Entitlements"**
3. Sollte für Debug und Release auf `App/App.entitlements` zeigen

## Schritt 6: Provisioning Profile erstellen

Xcode sollte das automatisch machen mit "Automatically manage signing". Falls Fehler auftreten:

1. Gehe zu [Apple Developer Portal](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Wähle deine App ID: `at.habdawas.app`
4. Aktiviere **Associated Domains** Capability
5. Klicke **Save**
6. Zurück in Xcode: **Product → Clean Build Folder** (Cmd+Shift+K)
7. Versuche erneut zu builden

## Schritt 7: Build und Test

### 7.1 Build für Simulator

```bash
# Im Terminal
cd /Users/martinmollay/Development/iphone_app
npx cap sync ios
npx cap open ios
```

Dann in Xcode:
1. Wähle einen Simulator (z.B. iPhone 15 Pro)
2. Klicke auf **Play** (Cmd+R)
3. App sollte erfolgreich builden und starten

### 7.2 Build für echtes iOS-Gerät

**WICHTIG:** Universal Links funktionieren nur auf echten Geräten, nicht im Simulator!

1. Verbinde dein iPhone per USB
2. Wähle dein iPhone als Target
3. Falls "Untrusted Developer" Warnung:
   - iPhone: **Einstellungen → Allgemein → VPN & Geräteverwaltung**
   - Vertraue deinem Developer Account
4. Klicke auf **Play** (Cmd+R)

## Schritt 8: Universal Links testen

### 8.1 Vorbereitung

1. Stelle sicher, dass die App auf deinem iPhone installiert ist
2. Lösche die App und installiere neu, damit iOS die AASA-Datei neu lädt:
   ```bash
   # App löschen vom iPhone
   # Dann neu builden in Xcode
   ```

### 8.2 Universal Link Diagnostics

**iOS 14+ bietet Diagnostics:**

1. Öffne auf dem iPhone: **Einstellungen → Entwickler** (falls verfügbar)
2. Aktiviere **Associated Domains Development**
3. Gehe zu **Associated Domains Diagnostics**
4. Teste die Domain `beta.habdawas.at`

**Manueller Test:**

1. Öffne **Notes** oder **Nachrichten** auf dem iPhone
2. Tippe den Link: `https://beta.habdawas.at/auth/callback?test=1`
3. Halte den Link gedrückt
4. Es sollte angezeigt werden: **"Open in HabDaWas"**
5. Falls nicht: Universal Links sind noch nicht aktiv

### 8.3 Google OAuth Flow testen

1. Öffne die HabDaWas App auf dem iPhone
2. Klicke auf **"Mit Google anmelden"**
3. Safari öffnet sich → Google Login
4. Nach erfolgreicher Anmeldung:
   - Google leitet zu `https://beta.habdawas.at/auth/callback?platform=ios&...` weiter
   - **ERWARTETES VERHALTEN (mit Universal Links):**
     - Die App öffnet sich automatisch
     - Keine weitere Weiterleitung nötig
   - **FALLBACK (ohne Universal Links):**
     - Die Callback-Seite leitet zu `habdawas://auth/callback#...` weiter
     - Die App öffnet sich über Custom URL Scheme

## Troubleshooting

### Problem: "Signing for 'App' requires a development team"

**Lösung:**
- Gehe zu **Signing & Capabilities**
- Wähle Team: **"Martin Mollay (G5QYXZ4B6L)"**

### Problem: "No profiles for 'at.habdawas.app' were found"

**Lösung:**
- Aktiviere **Automatically manage signing**
- Xcode erstellt automatisch ein Provisioning Profile

### Problem: Universal Links funktionieren nicht

**Mögliche Ursachen:**

1. **AASA-Datei nicht erreichbar:**
   ```bash
   curl -I https://beta.habdawas.at/.well-known/apple-app-site-association
   # Sollte: HTTP/2 200 und content-type: application/json zurückgeben
   ```

2. **App wurde nicht neu installiert:**
   - iOS cached die AASA-Datei
   - Lösche die App vom Gerät
   - Installiere neu von Xcode

3. **Associated Domains Capability fehlt:**
   - Überprüfe in **Signing & Capabilities**
   - Füge erneut hinzu falls nötig

4. **Entitlements-Datei nicht verlinkt:**
   - Überprüfe in **Build Settings** → **Code Signing Entitlements**
   - Sollte `App/App.entitlements` sein

5. **App ID nicht korrekt konfiguriert:**
   - Gehe zu [Apple Developer Portal](https://developer.apple.com/account/)
   - **Identifiers** → `at.habdawas.app`
   - Stelle sicher, dass **Associated Domains** aktiviert ist

6. **Provisioning Profile nicht aktualisiert:**
   ```bash
   # In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
   # Dann: Product → Build (Cmd+B)
   ```

### Problem: "The aps-environment entitlement is missing"

**Lösung:**
- Push Notifications Capability ist bereits in der Entitlements-Datei
- Falls Fehler auftritt: **"+ Capability"** → **Push Notifications** hinzufügen

### Problem: Build schlägt fehl mit "Command CodeSign failed"

**Lösung:**
1. **Keychain Access** öffnen
2. Suche nach deinem Developer Certificate
3. Falls abgelaufen: Lade ein neues Certificate von developer.apple.com herunter
4. Importiere es in Keychain
5. In Xcode: **Product → Clean Build Folder** (Cmd+Shift+K)

## Verifizierung

Nach erfolgreicher Konfiguration solltest du sehen:

✅ **In Xcode Signing & Capabilities:**
- Team: Martin Mollay (G5QYXZ4B6L)
- Provisioning Profile: Automatically generated
- Capabilities:
  - Associated Domains mit `applinks:beta.habdawas.at`
  - Push Notifications (development)

✅ **Build erfolgreich:**
- Für Simulator
- Für echtes iOS-Gerät

✅ **Universal Links funktionieren:**
- Link in Notes/Messages öffnet die App
- Google OAuth Flow redirected direkt zur App

## Nächste Schritte nach erfolgreicher Konfiguration

1. **Teste Google OAuth vollständig:**
   - Login
   - Session-Persistenz
   - Logout

2. **Produktions-Build vorbereiten:**
   - Ändere `aps-environment` von `development` zu `production` in Entitlements
   - Erstelle Production Provisioning Profile
   - Archive erstellen für App Store

3. **App Store Connect einrichten:**
   - App registrieren
   - Screenshots vorbereiten
   - App für Review einreichen

## Support und Ressourcen

- [Apple Developer Documentation - Universal Links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)

## Kontakt

Bei Problemen, check die Logs:
- Xcode Console während App läuft
- Safari Console auf dem iPhone (für Web-Teil)
- `/src/contexts/AuthContext.tsx` enthält ausführliche Console-Logs für OAuth Flow

---

**Version:** 1.0.0
**Letztes Update:** 2025-10-14
**Status:** Apple Developer Account konfiguriert, bereit für Universal Links Setup
