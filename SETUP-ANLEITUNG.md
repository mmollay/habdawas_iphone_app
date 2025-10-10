# 🚀 Setup-Anleitung für HabDaWas iOS App

## Aktuelle Situation

Das Capacitor-Projekt ist fertig eingerichtet, aber für die iOS-Entwicklung werden noch einige Tools benötigt.

## ❗ Was fehlt noch:

### 1. **Xcode** (erforderlich)
- **Status**: Nicht installiert
- **Größe**: ~15 GB
- **Preis**: Kostenlos
- **Download**: [Mac App Store - Xcode](https://apps.apple.com/app/xcode/id497799835)

⏱️ **Installation dauert ca. 30-60 Minuten** (je nach Internet-Geschwindigkeit)

### 2. **CocoaPods** (erforderlich)
- **Status**: Nicht installiert
- **Wird automatisch** durch Setup-Script installiert

### 3. **iOS Dependencies**
- **Status**: Noch nicht installiert
- **Wird automatisch** durch Setup-Script installiert

---

## 📋 Setup-Schritte

### Schritt 1: Xcode installieren

1. Öffne den **Mac App Store**
2. Suche nach **"Xcode"**
3. Klicke auf **"Laden"** / **"Installieren"**
4. Warte bis die Installation abgeschlossen ist
5. Öffne Xcode einmal und akzeptiere die License Agreement

**Alternativ via Terminal:**
```bash
# Öffnet App Store direkt bei Xcode
open "macappstores://apps.apple.com/app/xcode/id497799835"
```

### Schritt 2: Setup-Script ausführen

Sobald Xcode installiert ist:

```bash
cd /Users/martinmollay/Development/iphone_app
./setup.sh
```

Das Script führt automatisch aus:
- ✅ Xcode Command Line Tools Konfiguration
- ✅ Xcode License Akzeptierung
- ✅ CocoaPods Installation
- ✅ iOS Dependencies Installation (pod install)

**Das Script wird nach deinem sudo-Passwort fragen** - das ist normal und sicher.

### Schritt 3: App testen

Nach erfolgreichem Setup:

```bash
# App im Simulator starten
npm run dev
```

Oder manuell in Xcode:
```bash
npx cap open ios
```

Dann in Xcode:
1. Simulator auswählen (z.B. "iPhone 15 Pro")
2. Build & Run klicken (▶️) oder `⌘ + R`

---

## 🎯 Schnellstart (wenn Xcode bereits installiert)

Falls Xcode bereits installiert ist, einfach:

```bash
./setup.sh
```

Das Script prüft automatisch alle Voraussetzungen und installiert fehlende Komponenten.

---

## ⚙️ Alternative: Manuelle Installation

Falls du das Setup lieber manuell durchführen möchtest:

### 1. Xcode Command Line Tools konfigurieren
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

### 2. CocoaPods installieren
```bash
sudo gem install cocoapods
```

### 3. iOS Dependencies installieren
```bash
cd ios/App
pod install
cd ../..
```

### 4. Capacitor synchronisieren
```bash
npx cap sync ios
```

---

## 🔍 Troubleshooting

### Problem: "xcode-select: error: tool 'xcodebuild' requires Xcode"

**Lösung**: Xcode ist nicht installiert oder nicht richtig konfiguriert.
1. Installiere Xcode aus dem App Store
2. Führe `./setup.sh` aus

### Problem: "sudo: a password is required"

**Lösung**: Das ist normal - gib dein macOS-Passwort ein.

### Problem: "pod: command not found"

**Lösung**: CocoaPods ist nicht installiert.
```bash
sudo gem install cocoapods
```

### Problem: "Unable to find a target named 'App'"

**Lösung**: Pod install wurde noch nicht ausgeführt.
```bash
cd ios/App
pod install
cd ../..
```

---

## ✅ Erfolgs-Check

Nach dem Setup sollten diese Befehle funktionieren:

```bash
# Xcode Version prüfen
xcodebuild -version
# Sollte zeigen: Xcode 15.x oder höher

# CocoaPods Version prüfen
pod --version
# Sollte zeigen: 1.x.x

# Pods prüfen
ls ios/App/Pods/
# Sollte mehrere Pod-Ordner zeigen

# Capacitor Status
npx cap doctor ios
# Sollte "iOS: installed" zeigen
```

---

## 🎉 Nach erfolgreichem Setup

Die App ist dann bereit für:
- ✅ Simulator Testing
- ✅ iPhone Device Testing (mit USB-Kabel)
- ✅ App Store Deployment (mit Apple Developer Account)

**Weitere Schritte:**
1. App Icons erstellen → Siehe `ICONS-README.md`
2. Auf physischem iPhone testen
3. Push Notifications einrichten
4. App Store vorbereiten

---

## 📞 Support

Bei Problemen:
1. Prüfe die Fehlerausgabe des Setup-Scripts
2. Checke `README.md` für detaillierte Troubleshooting-Tipps
3. Console in Xcode öffnen (⌘ + Shift + C)

**Wichtige Dateien:**
- `README.md` - Vollständige Dokumentation
- `ICONS-README.md` - App Icon Anleitung
- `setup.sh` - Dieses Setup-Script

---

**Geschätzte Setup-Zeit**: 45-90 Minuten (inkl. Xcode Download)
**Schwierigkeit**: Einfach (größtenteils automatisch)
