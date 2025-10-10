# Resources Folder

Dieser Ordner enthält alle Assets für deine App.

## Benötigte Dateien

### App Icon
- **Dateiname**: `icon.png`
- **Größe**: 1024x1024px
- **Format**: PNG (ohne Transparenz)
- **Beschreibung**: Haupticon der App, wird für alle Größen skaliert

### Splash Screen
- **Dateiname**: `splash.png`
- **Größe**: 2732x2732px
- **Format**: PNG
- **Beschreibung**: Wird beim App-Start angezeigt

## Assets generieren

Sobald du `icon.png` und `splash.png` in diesem Ordner abgelegt hast, führe aus:

```bash
# Installiere Capacitor Assets Plugin
npm install @capacitor/assets --save-dev

# Generiere alle benötigten Größen
npx capacitor-assets generate
```

Das Plugin erstellt automatisch alle benötigten Icon- und Splash-Screen-Größen für iOS.

## Platzhalter ersetzen

1. Erstelle dein App-Icon (1024x1024px)
2. Speichere es als `icon.png` in diesem Ordner
3. Erstelle deinen Splash Screen (2732x2732px)
4. Speichere ihn als `splash.png` in diesem Ordner
5. Führe `npx capacitor-assets generate` aus

## Design-Tipps für beta.habdawas.at

- Verwende das Logo oder Markenzeichen von habdawas.at
- Achte auf konsistente Farben mit der Website
- Halte das Design einfach und klar erkennbar
- Teste auf verschiedenen Bildschirmgrößen

Mehr Details findest du in der `ICONS-README.md` im Hauptverzeichnis.
