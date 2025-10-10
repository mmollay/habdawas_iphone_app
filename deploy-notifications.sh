#!/bin/bash

# =====================================================
# HabDaWas Push Notifications - Deployment Script
# =====================================================
#
# Dieses Script deployt alle Supabase Komponenten
#
# Usage:
#   chmod +x deploy-notifications.sh
#   ./deploy-notifications.sh
#
# =====================================================

set -e  # Exit bei Fehler

echo "🚀 HabDaWas Push Notifications Deployment"
echo "=========================================="
echo ""

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project Configuration
PROJECT_REF="hsbjflixgavjqxvnkivi"
SUPABASE_URL="https://hsbjflixgavjqxvnkivi.supabase.co"

# =====================================================
# Step 1: Supabase CLI Check
# =====================================================

echo "📦 Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI nicht gefunden!${NC}"
    echo ""
    echo "Installation:"
    echo "  brew install supabase/tap/supabase"
    echo "  # oder"
    echo "  npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI gefunden: $(supabase --version)${NC}"
echo ""

# =====================================================
# Step 2: Login Check
# =====================================================

echo "🔐 Checking Supabase Login..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nicht eingeloggt${NC}"
    echo "Login durchführen..."
    supabase login
fi

echo -e "${GREEN}✅ Eingeloggt${NC}"
echo ""

# =====================================================
# Step 3: Project Link
# =====================================================

echo "🔗 Linking to Project..."
if [ ! -f .supabase/config.toml ]; then
    echo "Linking zu Project: $PROJECT_REF"
    supabase link --project-ref $PROJECT_REF
else
    echo -e "${GREEN}✅ Projekt bereits gelinkt${NC}"
fi
echo ""

# =====================================================
# Step 4: Database Schema Check
# =====================================================

echo "🗄️  Database Schema Status..."
echo -e "${YELLOW}⚠️  Schema muss manuell installiert werden${NC}"
echo ""
echo "Bitte führen Sie diese Schritte aus:"
echo "1. Öffnen Sie: $SUPABASE_URL/project/$PROJECT_REF/sql"
echo "2. Kopieren Sie den Inhalt von: supabase/schema.sql"
echo "3. Fügen Sie ihn im SQL Editor ein"
echo "4. Klicken Sie auf 'Run'"
echo ""
read -p "Schema installiert? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Abgebrochen. Bitte installieren Sie zuerst das Schema.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Schema installiert${NC}"
echo ""

# =====================================================
# Step 5: APNs Secrets Check
# =====================================================

echo "🔑 Checking APNs Secrets..."
echo ""
echo -e "${YELLOW}APNs Credentials benötigt:${NC}"
echo "1. APNS_KEY_ID"
echo "2. APNS_TEAM_ID"
echo "3. APNS_KEY_P8"
echo ""

# Check if secrets exist
if supabase secrets list 2>/dev/null | grep -q "APNS_KEY_ID"; then
    echo -e "${GREEN}✅ APNS_KEY_ID bereits gesetzt${NC}"
else
    echo -e "${RED}❌ APNS_KEY_ID fehlt${NC}"
    read -p "APNS_KEY_ID eingeben: " APNS_KEY_ID
    if [ ! -z "$APNS_KEY_ID" ]; then
        supabase secrets set APNS_KEY_ID="$APNS_KEY_ID"
    fi
fi

if supabase secrets list 2>/dev/null | grep -q "APNS_TEAM_ID"; then
    echo -e "${GREEN}✅ APNS_TEAM_ID bereits gesetzt${NC}"
else
    echo -e "${RED}❌ APNS_TEAM_ID fehlt${NC}"
    read -p "APNS_TEAM_ID eingeben: " APNS_TEAM_ID
    if [ ! -z "$APNS_TEAM_ID" ]; then
        supabase secrets set APNS_TEAM_ID="$APNS_TEAM_ID"
    fi
fi

if supabase secrets list 2>/dev/null | grep -q "APNS_KEY_P8"; then
    echo -e "${GREEN}✅ APNS_KEY_P8 bereits gesetzt${NC}"
else
    echo -e "${RED}❌ APNS_KEY_P8 fehlt${NC}"
    echo ""
    echo "Bitte setzen Sie APNS_KEY_P8 manuell:"
    echo '  supabase secrets set APNS_KEY_P8="-----BEGIN PRIVATE KEY-----'
    echo '  [Ihr P8 Key Content]'
    echo '  -----END PRIVATE KEY-----"'
    echo ""
fi

echo ""

# =====================================================
# Step 6: Deploy Edge Function
# =====================================================

echo "🚀 Deploying Edge Function..."
if [ -d "supabase/functions/send-push-notification" ]; then
    supabase functions deploy send-push-notification --no-verify-jwt
    echo -e "${GREEN}✅ Edge Function deployed${NC}"
else
    echo -e "${RED}❌ Edge Function nicht gefunden: supabase/functions/send-push-notification${NC}"
    exit 1
fi
echo ""

# =====================================================
# Step 7: Test Edge Function
# =====================================================

echo "🧪 Testing Edge Function..."
echo ""
echo "Test-URL:"
echo "  $SUPABASE_URL/functions/v1/send-push-notification"
echo ""
echo "Beispiel Test-Request:"
echo '  curl -X POST "$SUPABASE_URL/functions/v1/send-push-notification" \'
echo '    -H "Authorization: Bearer YOUR_ANON_KEY" \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{"user_id": 1, "title": "Test", "body": "Hello!"}'"'"
echo ""

# =====================================================
# Step 8: iOS App Sync
# =====================================================

echo "📱 iOS App Sync..."
echo "Führen Sie aus:"
echo "  npx cap sync ios"
echo ""

read -p "iOS App jetzt syncen? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx cap sync ios
    echo -e "${GREEN}✅ iOS App synced${NC}"
fi
echo ""

# =====================================================
# Done!
# =====================================================

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Deployment abgeschlossen!${NC}"
echo "=========================================="
echo ""
echo "Nächste Schritte:"
echo "1. ✅ Schema in Supabase installiert"
echo "2. ✅ Edge Function deployed"
echo "3. ✅ iOS App konfiguriert"
echo ""
echo "TODO:"
echo "- Triggers aktivieren (supabase/triggers.sql)"
echo "- App auf physischem iPhone testen"
echo "- Test-Notification senden"
echo ""
echo "Dokumentation:"
echo "  - PUSH-NOTIFICATIONS-SETUP.md"
echo "  - QUICK-START-NOTIFICATIONS.md"
echo ""
echo "Viel Erfolg! 🚀"
