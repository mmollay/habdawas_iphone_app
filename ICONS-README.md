# App Icons & Splash Screen Guide

## App Icon erstellen

### Benötigte Größen für iOS

Für eine vollständige iOS-App benötigst du folgende Icon-Größen:

- **1024x1024px** - App Store Icon (wichtigste Größe)
- 180x180px - iPhone (3x)
- 120x120px - iPhone (2x)
- 167x167px - iPad Pro
- 152x152px - iPad (2x)
- 76x76px - iPad (1x)
- 40x40px - Spotlight (2x)
- 29x29px - Settings (1x)
- 58x58px - Settings (2x)
- 87x87px - Settings (3x)

### Design-Richtlinien

1. **Quadratisch**: Alle Icons müssen quadratisch sein
2. **Keine Transparenz**: iOS fügt automatisch abgerundete Ecken hinzu
3. **Kein Text**: Icons sollten visuell erkennbar sein ohne Text
4. **Einfaches Design**: Klar erkennbar auch in kleiner Größe
5. **Einheitliche Farben**: Passend zu deiner Brand

### Empfohlene Tools

**Online Icon Generator:**
- [Icon.kitchen](https://icon.kitchen/) - Kostenloser Icon Generator
- [AppIcon.co](https://appicon.co/) - Generiert alle benötigten Größen
- [MakeAppIcon](https://makeappicon.com/) - Erstellt vollständiges Set

**Design Tools:**
- Figma (kostenlos)
- Adobe Illustrator
- Sketch (Mac only)
- Canva (einfach für Anfänger)

## Installation der Icons

### Methode 1: Automatisch mit Capacitor Assets

1. Erstelle ein hochauflösendes Icon (1024x1024px)
2. Installiere das Capacitor Assets Plugin:

```bash
npm install @capacitor/assets --save-dev
```

3. Erstelle Ordnerstruktur:

```
resources/
├── icon.png (1024x1024px)
└── splash.png (2732x2732px)
```

4. Generiere alle Größen:

```bash
npx capacitor-assets generate
```

### Methode 2: Manuell in Xcode

1. Öffne das Projekt in Xcode:
   ```bash
   npx cap open ios
   ```

2. In Xcode:
   - Navigiere zu `App/App/Assets.xcassets/AppIcon.appiconset`
   - Ziehe deine Icons in die entsprechenden Slots
   - Stelle sicher, dass alle Größen gefüllt sind

## Splash Screen erstellen

### Design-Empfehlungen

- **Größe**: 2732x2732px (universelle Größe)
- **Safe Area**: Zentriere wichtige Elemente im inneren 1024x1024px Bereich
- **Einfach**: Nur Logo + Hintergrundfarbe
- **Schnell**: Sollte maximal 2 Sekunden angezeigt werden

### Konfiguration

Die Splash Screen Einstellungen findest du in `capacitor.config.json`:

```json
"SplashScreen": {
  "launchShowDuration": 2000,
  "backgroundColor": "#ffffff",
  "showSpinner": false
}
```

### Platzierung

Speichere den Splash Screen als:
- `resources/splash.png` (für automatische Generierung)
- Oder manuell in Xcode unter `Assets.xcassets/Splash.imageset`

## Schnellstart

### Einfache Lösung für den Anfang

1. Erstelle mit einem Online-Tool (z.B. Canva) ein 1024x1024px Icon
2. Nutze [AppIcon.co](https://appicon.co/) um alle Größen zu generieren
3. Lade das generierte .zip herunter
4. Ersetze die Dateien in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Für beta.habdawas.at

Empfehlung:
- Verwende das Logo/Branding von habdawas.at
- Wähle die Hauptfarbe der Website als Hintergrund
- Halte das Design konsistent mit der Website

## Wichtige Hinweise

⚠️ **App Store Anforderungen:**
- Das 1024x1024px Icon MUSS vorhanden sein für App Store Submission
- Keine Transparenz oder Alpha-Kanäle
- RGB-Farbraum (nicht CMYK)
- PNG-Format

⚠️ **Testing:**
- Teste alle Icon-Größen auf verschiedenen iOS-Geräten
- Prüfe die Lesbarkeit in hell/dunkel Modi
- Achte auf die Darstellung im App Switcher

## Weitere Ressourcen

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Capacitor Assets Plugin](https://github.com/ionic-team/capacitor-assets)
- [iOS Icon Design Tips](https://developer.apple.com/design/tips/)

---

**Nächste Schritte:**
1. Icon erstellen (1024x1024px)
2. Mit Tool alle Größen generieren
3. Icons in Xcode platzieren
4. App bauen und auf Gerät testen
