#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Extract database connection details from VITE_SUPABASE_URL
PROJECT_REF="hsbjflixgavjqxvnkivi"

echo "🚀 Running Community Credit System Migration..."
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Installing via Homebrew..."
    brew install postgresql
fi

# Run migration using Supabase connection string
# You'll need to get the DB password from Supabase Dashboard > Settings > Database
echo "📝 Please enter your Supabase database password:"
echo "   (Get it from: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database)"
read -s DB_PASSWORD

echo ""
echo "🔄 Executing migration..."

PGPASSWORD=$DB_PASSWORD psql \
  -h "db.${PROJECT_REF}.supabase.co" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f database/migrations/community_credit_system.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Created tables:"
    echo "   - credit_system_settings"
    echo "   - donations"
    echo "   - community_pot_transactions"
    echo ""
    echo "🔄 Please reload your web app (Cmd+R)"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
