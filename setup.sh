#!/bin/bash

echo "🚀 HabDaWas iOS App - Setup Script"
echo "===================================="
echo ""

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Xcode prüfen
echo "📱 Schritt 1/5: Xcode Installation prüfen..."
if [ -d "/Applications/Xcode.app" ]; then
    echo -e "${GREEN}✓ Xcode ist installiert${NC}"
else
    echo -e "${RED}✗ Xcode ist NICHT installiert${NC}"
    echo "   Bitte installiere Xcode aus dem Mac App Store:"
    echo "   https://apps.apple.com/app/xcode/id497799835"
    exit 1
fi

# 2. Xcode Command Line Tools konfigurieren
echo ""
echo "🔧 Schritt 2/5: Xcode Command Line Tools konfigurieren..."
echo "   (benötigt sudo - bitte Passwort eingeben)"
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Xcode Command Line Tools konfiguriert${NC}"
else
    echo -e "${RED}✗ Fehler beim Konfigurieren${NC}"
    exit 1
fi

# 3. Xcode License akzeptieren
echo ""
echo "📄 Schritt 3/5: Xcode License akzeptieren..."
echo "   (benötigt sudo - bitte Passwort eingeben falls nötig)"
sudo xcodebuild -license accept

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Xcode License akzeptiert${NC}"
else
    echo -e "${YELLOW}⚠ License eventuell bereits akzeptiert${NC}"
fi

# 4. CocoaPods installieren
echo ""
echo "💎 Schritt 4/5: CocoaPods installieren..."

if command -v pod &> /dev/null; then
    echo -e "${GREEN}✓ CocoaPods ist bereits installiert (Version: $(pod --version))${NC}"
else
    echo "   Installiere CocoaPods (benötigt sudo)..."
    sudo gem install cocoapods

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ CocoaPods installiert${NC}"
    else
        echo -e "${RED}✗ Fehler beim Installieren von CocoaPods${NC}"
        exit 1
    fi
fi

# 5. iOS Dependencies installieren
echo ""
echo "📦 Schritt 5/5: iOS Dependencies installieren..."
cd ios/App

if [ -f "Podfile" ]; then
    echo "   Führe 'pod install' aus..."
    pod install

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ iOS Dependencies installiert${NC}"
    else
        echo -e "${RED}✗ Fehler bei pod install${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Podfile nicht gefunden${NC}"
    exit 1
fi

cd ../..

# Abschluss
echo ""
echo "===================================="
echo -e "${GREEN}✅ Setup erfolgreich abgeschlossen!${NC}"
echo ""
echo "🎉 Nächste Schritte:"
echo "   1. App im Simulator testen:"
echo "      npm run dev"
echo ""
echo "   2. Oder manuell Xcode öffnen:"
echo "      npx cap open ios"
echo ""
echo "   3. In Xcode: Simulator auswählen und Build & Run (⌘+R)"
echo ""
