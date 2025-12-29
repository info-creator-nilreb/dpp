#!/bin/bash

# Automatisches Migration Script für Production
# Führt alle ausstehenden Migrationen aus

set -e  # Exit on error

echo "=========================================="
echo "Production Migration - Automatisch"
echo "=========================================="
echo ""

# Lade .env Datei falls vorhanden
if [ -f .env ]; then
    echo "📄 Lade .env Datei..."
    export $(cat .env | grep -v '^#' | grep DATABASE_URL | xargs)
    echo "✅ .env Datei geladen"
else
    echo "❌ FEHLER: .env Datei nicht gefunden!"
    exit 1
fi

# Prüfe ob DATABASE_URL gesetzt ist
if [ -z "$DATABASE_URL" ]; then
    echo "❌ FEHLER: DATABASE_URL ist nicht in .env gesetzt!"
    exit 1
fi

echo "✅ DATABASE_URL ist gesetzt"
echo ""

echo "📊 Prüfe Migrations-Status..."
npx prisma migrate status || true

echo ""
echo "🚀 Wende alle ausstehenden Migrationen an..."
npx prisma migrate deploy

echo ""
echo "✅ Migrationen erfolgreich angewendet!"
echo ""
echo "📦 Generiere Prisma Client..."
npx prisma generate

echo ""
echo "✅ Fertig! Migrationen wurden erfolgreich auf Production angewendet."


