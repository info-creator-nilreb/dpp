#!/bin/bash

# Sync Dev to Prod Database
# Dev: jhxdwgnvmbnxjwiaodtj (30 Tabellen)
# Prod: fnfuklgbsojzdfnmrfad (21 Tabellen → soll 30 werden)

set -e

echo "=========================================="
echo "Dev → Prod Datenbank-Synchronisation"
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
    exit 0
fi

echo "⚠️  Unterschied erkannt: Dev hat $DEV_TABLES, Prod hat $PROD_TABLES"
echo ""

read -p "Möchtest du die fehlenden Tabellen in Production erstellen? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Abgebrochen."
    exit 0
fi

echo ""
echo "🚀 Synchronisiere Schema mit Production..."
echo "   (Dies erstellt fehlende Tabellen und Spalten)"
echo ""

# Setze PROD_URL für Prisma
export DATABASE_URL="$PROD_URL"

# Verwende db push um Schema zu synchronisieren
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "📦 Generiere Prisma Client..."
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


