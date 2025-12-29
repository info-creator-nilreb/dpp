#!/bin/bash

# Apply migrations to Prod database (non-interactive)
# Dev: jhxdwgnvmbnxjwiaodtj (31 Tabellen)
# Prod: fnfuklgbsojzdfnmrfad (29 Tabellen → soll 31 werden)

set -e

echo "=========================================="
echo "Schema-Synchronisation: Dev → Prod"
echo "=========================================="
echo ""

# Lade .env
if [ -f .env ]; then
    # Source .env file properly
    set -a
    source .env
    set +a
fi

# Konstruiere URLs basierend auf den DB-IDs
DEV_DB_ID="jhxdwgnvmbnxjwiaodtj"
PROD_DB_ID="fnfuklgbsojzdfnmrfad"

# Extrahiere Credentials aus DEV_DATABASE_URL
DEV_URL="${DATABASE_URL}"
if [ -z "$DEV_URL" ]; then
    echo "❌ DATABASE_URL nicht gefunden in .env"
    echo "💡 Bitte DATABASE_URL in .env setzen"
    exit 1
fi

# Konstruiere PROD_URL (gleiche Credentials, andere DB-ID)
PROD_URL=$(echo "$DEV_URL" | sed "s/${DEV_DB_ID}/${PROD_DB_ID}/g")

echo "🔍 Dev URL Pattern: ${DEV_URL:0:50}..."
echo "🔍 Prod URL Pattern: ${PROD_URL:0:50}..."
echo ""

echo "🔵 Dev-Datenbank:  ${DEV_DB_ID}"
echo "🟢 Prod-Datenbank: ${PROD_DB_ID}"
echo ""

# Prüfe Tabellen in Dev
echo "📊 Prüfe Tabellen in Dev..."
export DATABASE_URL="$DEV_URL"
DEV_TABLES=$(npx tsx scripts/list-tables.ts 2>&1 | grep "Gesamt" | grep -oE "[0-9]+" | head -1)
echo "   Dev hat: $DEV_TABLES Tabellen"
echo ""

# Prüfe Tabellen in Prod
echo "📊 Prüfe Tabellen in Prod..."
export DATABASE_URL="$PROD_URL"
PROD_TABLES=$(npx tsx scripts/list-tables.ts 2>&1 | grep "Gesamt" | grep -oE "[0-9]+" | head -1)
echo "   Prod hat: $PROD_TABLES Tabellen"
echo ""

if [ "$DEV_TABLES" -eq "$PROD_TABLES" ]; then
    echo "✅ Beide Datenbanken haben bereits $DEV_TABLES Tabellen!"
    echo ""
    echo "📋 Prüfe Migrations-Status..."
    export DATABASE_URL="$PROD_URL"
    npx prisma migrate status
    exit 0
fi

echo "⚠️  Unterschied erkannt: Dev hat $DEV_TABLES, Prod hat $PROD_TABLES"
echo ""
echo "🚀 Wende Schema-Änderungen an (nur Schema, keine Daten)..."
echo ""

# Setze PROD_URL für Prisma
export DATABASE_URL="$PROD_URL"

echo "📋 Schritt 1: Prüfe Migrations-Status..."
npx prisma migrate status

echo ""
echo "📋 Schritt 2: Wende ausstehende Migrationen an..."
npx prisma migrate deploy

echo ""
echo "📋 Schritt 3: Regeneriere Prisma Client..."
npx prisma generate

echo ""
echo "📊 Prüfe Tabellen nach Synchronisation..."
FINAL_TABLES=$(npx tsx scripts/list-tables.ts 2>&1 | grep "Gesamt" | grep -oE "[0-9]+" | head -1)
echo "   Prod hat jetzt: $FINAL_TABLES Tabellen"
echo ""

if [ "$FINAL_TABLES" -eq "$DEV_TABLES" ]; then
    echo "✅ Erfolgreich synchronisiert! Production hat jetzt $FINAL_TABLES Tabellen (wie Dev)."
else
    echo "⚠️  Production hat $FINAL_TABLES Tabellen (erwartet: $DEV_TABLES)"
    echo "   Bitte prüfe die Fehler oben."
fi

echo ""
echo "🎉 Schema-Synchronisation abgeschlossen!"

