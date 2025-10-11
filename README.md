# HabDaWas iOS App

iPhone-App für **beta.habdawas.at** - Fullscreen Web-App mit nativen iOS-Features

## 📱 Features

- ✅ **Fullscreen WebView** für beta.habdawas.at
- ✅ **Push Notifications** Support
- ✅ **Local Notifications** Support
- ✅ **Native iOS Integration** via Capacitor
- ✅ **Offline-Ready** (vorbereitet)
- ✅ **Safe Area Support** für iPhone mit Notch

## 🚀 Schnellstart

### Voraussetzungen

- **Node.js** (bereits installiert: v24.7.0)
- **npm** (bereits installiert: v11.6.0)
- **Xcode** (für iOS-Entwicklung)
- **CocoaPods** (für iOS Dependencies)

### CocoaPods installieren

Falls noch nicht installiert:

```bash
sudo gem install cocoapods
```

### Xcode konfigurieren

```bash
# Xcode Command Line Tools auf Xcode umstellen
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

### Dependencies installieren

```bash
# Node Dependencies sind bereits installiert
npm install

# iOS Dependencies installieren
cd ios/App
pod install
cd ../..
```

## 🔨 Entwicklung

### App im Simulator testen

```bash
# iOS-Plattform synchronisieren
npx cap sync ios

# Xcode öffnen
npx cap open ios
```

In Xcode:
1. Wähle einen Simulator (z.B. "iPhone 15 Pro")
2. Drücke `⌘ + R` oder klicke auf "Play"
3. Die App startet im Simulator

### Änderungen übernehmen

Nach Änderungen an der Webview (www/index.html):

```bash
npx cap sync ios
```

Danach in Xcode neu bauen (⌘ + R)

## 📦 Projekt-Struktur

```
iphone_app/
├── www/                        # Web-Assets
│   ├── index.html             # Haupt-HTML (enthält iframe zu beta.habdawas.at)
│   ├── capacitor.js           # Capacitor SDK Integration
│   └── notifications.js       # Push Notifications Helper
├── ios/                       # iOS Native Project
│   └── App/
│       ├── App/
│       │   ├── Info.plist    # iOS Konfiguration
│       │   └── Assets.xcassets/
│       └── Podfile
├── resources/                 # App Icons & Splash Screens
│   └── README.md             # Icon-Anweisungen
├── capacitor.config.json     # Capacitor Konfiguration
├── package.json              # Node Dependencies
├── ICONS-README.md           # Ausführliche Icon-Anleitung
└── README.md                 # Diese Datei

```

## 🎨 App Icons & Splash Screen

### Icons erstellen

1. Erstelle ein 1024x1024px Icon
2. Nutze einen Online-Generator: [AppIcon.co](https://appicon.co/)
3. Platziere die Dateien in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Alternativ: Automatisch generieren**

```bash
# Capacitor Assets Plugin installieren
npm install @capacitor/assets --save-dev

# Icon (1024x1024px) als resources/icon.png speichern
# Splash (2732x2732px) als resources/splash.png speichern

# Alle Größen generieren
npx capacitor-assets generate
```

Mehr Details: [ICONS-README.md](./ICONS-README.md)

## 🔔 Push Notifications einrichten

Die App ist bereits für Push Notifications vorbereitet.

### 1. Entwicklungs-Setup

Für echte Push Notifications brauchst du:
- Apple Developer Account (99€/Jahr)
- APNs Certificate/Key konfiguriert

### 2. Integration im Code

Die Notification-Logik findest du in `www/notifications.js`.

Beispiel-Nutzung in deiner Webseite:

```javascript
// In beta.habdawas.at einbinden
import { initPushNotifications } from './notifications.js';

// Bei App-Start aufrufen
initPushNotifications();
```

### 3. Test mit Local Notifications

Ohne APNs-Setup kannst du Local Notifications testen:

```javascript
import { scheduleLocalNotification } from './notifications.js';

scheduleLocalNotification('Test', 'Das ist eine Test-Notification');
```

## 🔐 Google OAuth Login einrichten

Die App unterstützt Google OAuth Login für iOS. **Wichtig**: Eine zusätzliche Supabase-Konfiguration ist erforderlich.

### Problem: OAuth Redirect funktioniert nicht

Nach dem Google Login im Safari bleibt der Browser offen und die App wird nicht automatisch geöffnet.

**Ursache**: Die Custom URL Scheme Redirect URL ist nicht in Supabase konfiguriert.

### Lösung: Supabase Dashboard konfigurieren

1. **Supabase Dashboard öffnen**: https://hsbjflixgavjqxvnkivi.supabase.co/project/hsbjflixgavjqxvnkivi
2. **Navigation**: Authentication → URL Configuration
3. **Redirect URLs hinzufügen**:
   ```
   at.habdawas.app://oauth-callback
   ```
4. **Bestehende URLs behalten**:
   ```
   https://beta.habdawas.at
   https://beta.habdawas.at/
   at.habdawas.app://oauth-callback
   ```
5. **Speichern** klicken

### Was bereits implementiert ist

✅ AuthContext mit Capacitor OAuth Support
✅ Deep Link Listener für iOS
✅ Custom URL Scheme in Info.plist (`at.habdawas.app://`)
✅ Automatisches Browser-Schließen nach Auth
✅ OAuth Loading Overlay mit Google Logo

### Testen

Nach der Supabase-Konfiguration:

```bash
npx cap open ios
```

In Xcode:
1. Build & Run (⌘ + R)
2. In der App auf "Mit Google anmelden" klicken
3. Safari öffnet sich mit Google Login
4. Nach Login sollte die **App automatisch wieder öffnen**
5. Safari schließt sich automatisch

### Detaillierte Anleitung

Siehe [SUPABASE-REDIRECT-FIX.md](./SUPABASE-REDIRECT-FIX.md) für:
- Schritt-für-Schritt Konfiguration
- Debugging-Tipps
- Häufige Fehler und Lösungen
- Security Best Practices

## 🔧 Konfiguration

### Capacitor Config

Alle App-Einstellungen in `capacitor.config.json`:

```json
{
  "appId": "at.habdawas.app",
  "appName": "HabDaWas",
  "webDir": "www",
  "server": {
    "hostname": "beta.habdawas.at",
    "allowNavigation": ["beta.habdawas.at", "*.habdawas.at"]
  },
  "ios": {
    "contentInset": "never",
    "scrollEnabled": true
  }
}
```

### iOS-spezifische Einstellungen

In `ios/App/App/Info.plist`:
- App Transport Security (HTTPS)
- Supported Orientations
- Status Bar Konfiguration

## 📱 Auf physischem iPhone testen

### 1. iPhone vorbereiten

1. iPhone mit USB-C/Lightning-Kabel verbinden
2. In iPhone-Einstellungen: Vertrauen dem Computer
3. Developer-Modus aktivieren (iOS 16+)

### 2. In Xcode

1. Wähle dein iPhone als Build Target
2. Gehe zu "Signing & Capabilities"
3. Wähle dein Development Team
4. Bundle Identifier: `at.habdawas.app` (oder ändere ihn)
5. Build & Run (⌘ + R)

### 3. Beim ersten Mal

- "Untrusted Developer" Warnung → Einstellungen → Allgemein → VPN & Geräteverwaltung → App erlauben

## 🚢 App Store Deployment

### Vorbereitung

1. **App Icon**: 1024x1024px erstellt und eingefügt
2. **Screenshots**: Erstelle Screenshots für verschiedene iPhone-Größen
3. **Privacy Policy**: Erforderlich für App Store
4. **App Store Connect**: App-Eintrag erstellen

### Build erstellen

In Xcode:
1. Product → Archive
2. Warte bis Archive fertig ist
3. Distribute App → App Store Connect
4. Upload to App Store

### App Store Connect

1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com/)
2. Fülle alle Metadaten aus
3. Lade Screenshots hoch
4. Wähle den Build aus
5. Submit for Review

**Hinweis**: Der Review-Prozess dauert 1-3 Tage.

## 🔒 Sicherheit & Datenschutz

### App Transport Security

Die App nutzt HTTPS für alle Verbindungen zu beta.habdawas.at.

Konfiguriert in `Info.plist`:
- Erlaubt nur sichere Verbindungen
- HTTPS-Verschlüsselung erforderlich
- Forward Secrecy aktiviert

### Permissions

Die App benötigt folgende Berechtigungen:
- **Push Notifications**: Optional, nur wenn User zustimmt
- **Internet**: Immer (für Webseite)

## 🐛 Troubleshooting

### Problem: CocoaPods Fehler

```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

### Problem: Xcode Build Fehler "No Signing Identity"

1. Xcode → Preferences → Accounts
2. Apple ID hinzufügen
3. Download Manual Profiles
4. Im Projekt: Signing & Capabilities → Team auswählen

### Problem: Webseite lädt nicht

1. Prüfe Internet-Verbindung
2. Prüfe ob beta.habdawas.at erreichbar ist
3. Console in Xcode prüfen (⌘ + Shift + C)

### Problem: Push Notifications funktionieren nicht

- Echte Push Notifications funktionieren **nur** auf physischen Geräten
- Simulator unterstützt keine APNs
- Apple Developer Account erforderlich

## ☁️ Vercel Deployment

Die App ist für Vercel-Deployment vorbereitet und deployed die optimierte mobile UI.

### Deployment-Konfiguration

Die Vercel-Konfiguration in `vercel.json` enthält:
- **Static File Serving** aus `www/` Verzeichnis
- **SPA Routing** (alle Requests → index.html)
- **Asset Caching** mit `max-age=31536000` für Optimierung
- **Security Headers** (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

### Vercel CLI Installation

```bash
npm install -g vercel
```

### Deployment

```bash
# Erstmaliges Deployment
vercel

# Production Deployment
vercel --prod
```

### Automatisches Deployment

Verbinde das Repository mit Vercel für automatische Deployments:
1. Gehe zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Import Git Repository
3. Configure Project (nutzt automatisch `vercel.json`)
4. Deploy

**Branch Strategy**:
- `main` → Production (`*.vercel.app`)
- Feature Branches → Preview Deployments

### Environment Variables

Setze in Vercel Dashboard unter "Settings → Environment Variables":
```
NEXT_PUBLIC_API_URL=https://beta.habdawas.at/api
# Weitere Environment Variables...
```

### Deployment URL

Nach Deployment erreichbar unter:
- Production: `https://habdawas-mobile.vercel.app`
- Preview: `https://habdawas-mobile-[branch].vercel.app`

## 📚 Weitere Ressourcen

### Capacitor

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Configuration](https://capacitorjs.com/docs/ios/configuration)
- [Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)

### iOS Entwicklung

- [Apple Developer](https://developer.apple.com/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Deployment & CI/CD

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

### Tools

- [Xcode](https://apps.apple.com/app/xcode/id497799835)
- [Capacitor Assets Generator](https://github.com/ionic-team/capacitor-assets)
- [AppIcon.co](https://appicon.co/) - Icon Generator
- [Vercel CLI](https://vercel.com/download)

## 🤝 Support & Fragen

Bei Fragen oder Problemen:
1. Prüfe die Xcode Console (Debug Area)
2. Checke `capacitor.config.json` Konfiguration
3. Verifiziere iOS Dependencies mit `pod install`

## 📝 Nächste Schritte

- [ ] **Google OAuth konfigurieren** → Siehe [SUPABASE-REDIRECT-FIX.md](./SUPABASE-REDIRECT-FIX.md) ⚠️ **WICHTIG**
- [ ] **App Icons erstellen** → Siehe [ICONS-README.md](./ICONS-README.md)
- [ ] **Auf Simulator testen** → `npx cap open ios`
- [ ] **Auf iPhone testen** → USB verbinden + Xcode Build
- [ ] **Push Notifications einrichten** → Apple Developer Account
- [ ] **App Store vorbereiten** → Screenshots, Beschreibung, Privacy Policy
- [ ] **App einreichen** → App Store Connect

---

**App Version**: 1.0.4
**Capacitor Version**: 7.4.3
**iOS Target**: iOS 13.0+
**Erstellt**: Oktober 2025
