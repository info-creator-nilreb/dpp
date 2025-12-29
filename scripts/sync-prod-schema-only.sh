#!/bin/bash

# Sync schema from Dev to Prod database (schema only, no data)
# Dev: jhxdwgnvmbnxjwiaodtj (32 Tabellen)
# Prod: fnfuklgbsojzdfnmrfad (30 Tabellen → soll 32 werden)

set -e

echo "=========================================="
echo "Schema-Synchronisation: Dev → Prod"
echo "=========================================="
echo ""

# Lade .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Konstruiere URLs basierend auf den DB-IDs
DEV_DB_ID="jhxdwgnvmbnxjwiaodtj"
PROD_DB_ID="fnfuklgbsojzdfnmrfad"

# Extrahiere Credentials aus DEV_DATABASE_URL
DEV_URL="${DATABASE_URL}"
if [ -z "$DEV_URL" ]; then
    echo "❌ DATABASE_URL nicht gefunden in .env"
    exit 1
fi

# Konstruiere PROD_URL (gleiche Credentials, andere DB-ID)
PROD_URL=$(echo "$DEV_URL" | sed "s/${DEV_DB_ID}/${PROD_DB_ID}/g")

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
echo "💡 Verwende Prisma Migrations um Schema zu synchronisieren"
echo "   (Nur Schema-Änderungen, keine Daten werden migriert)"
echo ""

read -p "Möchtest du die Schema-Änderungen in Production anwenden? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Abgebrochen."
    exit 0
fi

echo ""
echo "📋 Schritt 1: Prüfe Migrations-Status in Prod..."
echo ""
export DATABASE_URL="$PROD_URL"
npx prisma migrate status

echo ""
echo "📋 Schritt 2: Wende ausstehende Migrationen an (Schema nur)..."
echo ""
export DATABASE_URL="$PROD_URL"
npx prisma migrate deploy

echo ""
echo "📋 Schritt 3: Regeneriere Prisma Client..."
echo ""
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

