# Xcode Development Guide

Vollständiger Guide für iOS Development mit Xcode für die HabDaWas App.

## 📋 Voraussetzungen

- **macOS**: 12.0 (Monterey) oder höher
- **Xcode**: 14.0 oder höher
- **CocoaPods**: 1.11.0 oder höher
- **Xcode Command Line Tools**: Installiert und konfiguriert

## 🚀 Xcode Setup

### 1. Command Line Tools konfigurieren

```bash
# Xcode Command Line Tools auf Xcode umstellen
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Xcode Lizenz akzeptieren
sudo xcodebuild -license accept

# Prüfen ob alles korrekt ist
xcode-select -p
# Sollte ausgeben: /Applications/Xcode.app/Contents/Developer
```

### 2. CocoaPods Dependencies installieren

```bash
cd ios/App
pod install
cd ../..
```

**Wichtig**: Öffne immer `App.xcworkspace`, NICHT `App.xcodeproj`!

### 3. Xcode öffnen

```bash
# Via Capacitor CLI
npx cap open ios

# Oder direkt
open ios/App/App.xcworkspace
```

## 🔨 Build & Run

### Simulator auswählen

1. In Xcode: Oben links neben dem Play-Button
2. Wähle einen Simulator (empfohlen: **iPhone 15 Pro**)
3. Für iPad-Test: Wähle einen iPad Simulator

### App bauen und starten

- **Tastenkombination**: `⌘ + R`
- **Menü**: Product → Run
- **Toolbar**: Play-Button oben links

### Clean Build

Bei Problemen:
```bash
# In Xcode: Product → Clean Build Folder
# Oder Tastenkombination: ⌘ + Shift + K
```

## 📱 Auf physischem iPhone testen

### 1. iPhone vorbereiten

1. iPhone mit USB-C/Lightning-Kabel verbinden
2. Auf iPhone: "Diesem Computer vertrauen" bestätigen
3. **Developer-Modus aktivieren** (iOS 16+):
   - Einstellungen → Datenschutz & Sicherheit → Entwicklermodus → Aktivieren
   - iPhone wird neu starten

### 2. Signing & Capabilities

1. In Xcode: Wähle Projekt "App" (blaues Icon ganz oben)
2. Target "App" auswählen
3. Tab "Signing & Capabilities"
4. **Team**: Wähle dein Apple Developer Team
   - Ohne Apple Developer Account: Wähle deine Apple ID
   - Mit Developer Account: Wähle dein Team
5. **Bundle Identifier**: `at.habdawas.app` (oder ändere es)

### 3. Build & Deploy

1. Wähle dein iPhone als Build Target (oben links)
2. Drücke `⌘ + R`
3. **Beim ersten Mal**:
   - iPhone zeigt "Untrusted Developer" Warnung
   - Einstellungen → Allgemein → VPN & Geräteverwaltung → [Dein Account] → Vertrauen

## 🔧 Projekt-Konfiguration

### Build Settings

Wichtige Build Settings in Xcode:

| Setting | Wert | Beschreibung |
|---------|------|--------------|
| **iOS Deployment Target** | 14.0 | Minimale iOS Version |
| **Swift Language Version** | Swift 5 | Swift Compiler Version |
| **Optimization Level** | Debug: None, Release: Fastest | Build-Optimierung |
| **Enable Bitcode** | No | Bitcode deaktiviert |

### Info.plist Konfiguration

Wichtige Einstellungen in `ios/App/App/Info.plist`:

```xml
<!-- App Display Name -->
<key>CFBundleDisplayName</key>
<string>HabDaWas</string>

<!-- App Transport Security -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>beta.habdawas.at</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
        </dict>
    </dict>
</dict>

<!-- Supported Orientations -->
<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

### Capabilities

Aktivierte Capabilities:
- **Push Notifications**: Für Remote Push Notifications
- **Background Modes**: Für Background Notifications

## 🎨 Assets & Icons

### App Icon

1. Icons befinden sich in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
2. Benötigte Größen:
   - 1024x1024px (App Store)
   - 180x180px (iPhone 3x)
   - 120x120px (iPhone 2x)
   - 167x167px (iPad Pro)
   - 152x152px (iPad 2x)
   - 76x76px (iPad)

### Launch Screen

- Konfiguriert in: `ios/App/App/Base.lproj/LaunchScreen.storyboard`
- Oder via Splash Screen Plugin in `capacitor.config.json`

## 🔍 Debugging

### Console öffnen

- **Tastenkombination**: `⌘ + Shift + C`
- **Menü**: View → Debug Area → Show Debug Area

### Breakpoints setzen

1. Klicke auf Zeilennummer im Code-Editor
2. Blauer Marker erscheint
3. Bei Ausführung hält die App an diesem Punkt

### View Hierarchy Debug

- **Tastenkombination**: `⌘ + Shift + D` (während App läuft)
- Zeigt 3D-Ansicht der View-Hierarchie

### Network Debugging

1. Product → Scheme → Edit Scheme
2. Run → Arguments
3. Environment Variables hinzufügen:
   ```
   CFNETWORK_DIAGNOSTICS = 1
   ```

## 📦 CocoaPods Management

### Pods installieren

```bash
cd ios/App
pod install
cd ../..
```

### Pods updaten

```bash
cd ios/App
pod update
cd ../..
```

### Pod Cache leeren

```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

### Dependencies

Aktuell installierte Pods (siehe `Podfile`):
- **Capacitor**: Capacitor Core iOS Framework
- **CapacitorCordova**: Cordova Compatibility Layer
- **CapacitorLocalNotifications**: Local Notifications Plugin
- **CapacitorPushNotifications**: Push Notifications Plugin

## 🚢 App Store Build

### 1. Versionsnummer erhöhen

In Xcode:
1. Projekt "App" auswählen
2. Target "App" → General
3. **Version**: z.B. `1.0.0` (Marketing Version)
4. **Build**: z.B. `1` (Build Number)

### 2. Archive erstellen

1. Wähle Generic iOS Device als Build Target
2. Product → Archive
3. Warte bis Archivierung abgeschlossen ist
4. Organizer öffnet sich automatisch

### 3. Upload zu App Store Connect

1. Im Organizer: Wähle das Archive aus
2. Klicke "Distribute App"
3. Wähle "App Store Connect"
4. Folge dem Wizard:
   - Upload
   - Automatically manage signing
   - Upload
5. Warte auf Upload-Bestätigung

### 4. TestFlight (Optional)

Nach Upload zu App Store Connect:
1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com/)
2. Wähle deine App
3. TestFlight → iOS Builds
4. Füge interne/externe Tester hinzu

## 🐛 Troubleshooting

### Problem: "Command PhaseScriptExecution failed"

```bash
cd ios/App
rm -rf Pods/
pod deintegrate
pod install
cd ../..
```

### Problem: "No signing identity found"

1. Xcode → Preferences → Accounts
2. Apple ID hinzufügen (falls noch nicht vorhanden)
3. Download Manual Profiles
4. Im Projekt: Signing & Capabilities → Team auswählen

### Problem: "Module not found"

```bash
# Clean Build Folder
# In Xcode: ⌘ + Shift + K

# Dann:
cd ios/App
pod install
cd ../..

# Capacitor neu synchronisieren
npx cap sync ios
```

### Problem: "Simulator nicht verfügbar"

```bash
# Xcode Command Line Tools neu setzen
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Simulator reset
xcrun simctl shutdown all
xcrun simctl erase all
```

### Problem: DerivedData Issues

```bash
# DerivedData löschen
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Dann Clean Build in Xcode
```

## 🔐 Provisioning & Certificates

### Development Certificate

1. Xcode → Preferences → Accounts
2. Apple ID auswählen
3. Manage Certificates
4. "+" → Apple Development

### Distribution Certificate

Für App Store Deployment:
1. [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)
2. Certificates → "+"
3. iOS Distribution
4. Generate & Download
5. Doppelklick zum Installieren

### Provisioning Profiles

1. [Apple Developer Portal](https://developer.apple.com/account/resources/profiles/list)
2. Profiles → "+"
3. Distribution → App Store
4. Wähle App ID: `at.habdawas.app`
5. Download & Install

## 📚 Weiterführende Links

- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [iOS Development](https://developer.apple.com/ios/)
- [Capacitor iOS](https://capacitorjs.com/docs/ios)
- [CocoaPods](https://cocoapods.org/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [TestFlight](https://developer.apple.com/testflight/)

## 💡 Best Practices

### Development Workflow

1. **Immer Clean Build** nach größeren Änderungen
2. **Simulator testen** vor physischem Device
3. **Console beobachten** für Warnings/Errors
4. **Regelmäßig synchen**: `npx cap sync ios`
5. **Pod Updates**: Monatlich aktualisieren

### Performance

- **Debug Builds**: Keine Optimierung, schnellere Builds
- **Release Builds**: Volle Optimierung, langsamer zu bauen
- **Archive**: Immer mit Release-Konfiguration

### Sicherheit

- **Certificates**: Sicher aufbewahren
- **Provisioning Profiles**: Regelmäßig erneuern
- **API Keys**: Nie in Git committen (`.env` verwenden)
- **Code Signing**: Immer verifizieren vor Upload

---

**Version**: 1.0.0
**Zuletzt aktualisiert**: 2025-10-11
**Xcode Version**: 14.0+
**iOS Target**: 14.0+
