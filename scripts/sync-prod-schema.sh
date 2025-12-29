#!/bin/bash

# Sync schema from Dev to Prod database
# Only schema changes, no data migration

set -e

DEV_DB_ID="jhxdwgnvmbnxjwiaodtj"
PROD_DB_ID="fnfuklgbsojzdfnmrfad"

echo "🔄 Schema-Synchronisation: Dev → Prod"
echo "======================================"
echo ""
echo "Dev-Datenbank: $DEV_DB_ID"
echo "Prod-Datenbank: $PROD_DB_ID"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL ist nicht gesetzt"
  echo "💡 Bitte DATABASE_URL in .env setzen oder als Umgebungsvariable exportieren"
  exit 1
fi

# Extract current database URL pattern
CURRENT_URL="$DATABASE_URL"

# Construct Prod database URL
# Assuming Supabase format: postgresql://user:pass@host:port/db
if [[ "$CURRENT_URL" == *"$DEV_DB_ID"* ]]; then
  PROD_URL="${CURRENT_URL//$DEV_DB_ID/$PROD_DB_ID}"
  echo "✅ Prod-Datenbank-URL konstruiert"
else
  echo "⚠️  Konnte Prod-Datenbank-URL nicht automatisch konstruieren"
  echo "💡 Bitte PROD_DATABASE_URL manuell setzen:"
  echo "   export PROD_DATABASE_URL='postgresql://...@db.$PROD_DB_ID.supabase.co:5432/postgres?sslmode=require'"
  if [ -z "$PROD_DATABASE_URL" ]; then
    exit 1
  fi
  PROD_URL="$PROD_DATABASE_URL"
fi

echo ""
echo "📋 Schritt 1: Prüfe Migrations-Status..."
echo ""

# Check migration status
DATABASE_URL="$PROD_URL" npx prisma migrate status

echo ""
echo "📋 Schritt 2: Wende ausstehende Migrationen an..."
echo ""

# Apply migrations (schema only, no data)
DATABASE_URL="$PROD_URL" npx prisma migrate deploy

echo ""
echo "📋 Schritt 3: Regeneriere Prisma Client..."
echo ""

# Regenerate Prisma Client
npx prisma generate

echo ""
echo "✅ Schema-Synchronisation abgeschlossen!"
echo ""
echo "📊 Verifiziere Tabellen-Anzahl..."
echo ""

# Verify table count
DATABASE_URL="$PROD_URL" npx tsx scripts/list-tables.ts

echo ""
echo "🎉 Fertig! Prod-Datenbank sollte jetzt ${32} Tabellen haben (inkl. _prisma_migrations)"

