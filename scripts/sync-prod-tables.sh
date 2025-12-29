#!/bin/bash

# Sync Production Database Tables
# Erstellt fehlende Tabellen und Spalten in Production

set -e

echo "=========================================="
echo "Production Database Synchronisation"
echo "=========================================="
echo ""

# Lade .env
if [ -f .env ]; then
    echo "📄 Lade .env Datei..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ .env geladen"
else
    echo "❌ .env Datei nicht gefunden!"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL nicht gesetzt!"
    exit 1
fi

echo "✅ DATABASE_URL ist gesetzt"
echo ""

echo "📊 Prüfe aktuelle Tabellen in Production..."
CURRENT_TABLES=$(npx tsx scripts/list-tables.ts 2>&1 | grep -E "^\s+[0-9]+\." | wc -l | tr -d ' ')
echo "   Gefundene Tabellen: $CURRENT_TABLES"
echo ""

echo "🚀 Wende alle Migrationen an..."
npx prisma migrate deploy

echo ""
echo "🚀 Synchronisiere Schema mit Production..."
echo "   (Dies erstellt fehlende Tabellen und Spalten)"
echo ""

# Verwende db push um Schema zu synchronisieren (nur wenn nötig)
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "📦 Generiere Prisma Client..."
npx prisma generate

echo ""
echo "📊 Prüfe Tabellen nach Synchronisation..."
FINAL_TABLES=$(npx tsx scripts/list-tables.ts 2>&1 | grep -E "^\s+[0-9]+\." | wc -l | tr -d ' ')
echo "   Tabellen nach Sync: $FINAL_TABLES"
echo ""

if [ "$FINAL_TABLES" -ge 30 ]; then
    echo "✅ Erfolgreich synchronisiert! Production hat jetzt $FINAL_TABLES Tabellen."
else
    echo "⚠️  Production hat $FINAL_TABLES Tabellen (erwartet: 30)"
    echo "   Bitte prüfe die Fehler oben."
fi

