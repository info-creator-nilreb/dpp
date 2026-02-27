#!/bin/bash

# Migration Script für Production
# WICHTIG: Vor dem Ausführen ein Backup erstellen!

set -e  # Exit on error

echo "=========================================="
echo "Production Migration Script"
echo "=========================================="
echo ""

# Lade .env Datei falls vorhanden (set -a = export aller gesetzten Variablen)
if [ -f .env ]; then
    echo "📄 Lade .env Datei..."
    set -a
    # shellcheck source=/dev/null
    source .env 2>/dev/null || true
    set +a
    echo "✅ .env Datei geladen"
else
    echo "⚠️  Keine .env Datei gefunden"
fi

# Produktions-DB: DATABASE_URL_PRODUCTION hat Vorrang (für getrennte Dev/Prod)
if [ -n "$DATABASE_URL_PRODUCTION" ]; then
    export DATABASE_URL="$DATABASE_URL_PRODUCTION"
    export DIRECT_URL="$DIRECT_URL_PRODUCTION"
    echo "✅ DATABASE_URL_PRODUCTION wird für Migrationen verwendet (Produktions-DB)"
else
    echo "ℹ️  DATABASE_URL wird verwendet (setze DATABASE_URL_PRODUCTION für Produktions-DB)"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ FEHLER: DATABASE_URL ist nicht gesetzt!"
    echo "Bitte setze in .env: DATABASE_URL oder für Produktion: DATABASE_URL_PRODUCTION"
    echo "  (und optional DIRECT_URL_PRODUCTION für Migrations)"
    exit 1
fi

echo "✅ Datenbank-URL ist gesetzt"
echo "   (URL wird aus Sicherheitsgründen nicht angezeigt)"
echo ""

# Frage nach Bestätigung
read -p "⚠️  WICHTIG: Hast du ein Backup der Production-Datenbank erstellt? (yes/no): " backup_confirm
if [ "$backup_confirm" != "yes" ]; then
    echo "❌ Migration abgebrochen. Bitte erstelle zuerst ein Backup!"
    exit 1
fi

echo ""
echo "📊 Prüfe Migrations-Status..."
npx prisma migrate status

echo ""
read -p "Möchtest du die Migrationen jetzt anwenden? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Migration abgebrochen."
    exit 0
fi

echo ""
echo "🚀 Wende Migrationen an..."
npx prisma migrate deploy

echo ""
echo "✅ Migrationen erfolgreich angewendet!"
echo ""
echo "📦 Generiere Prisma Client..."
npx prisma generate

echo ""
echo "✅ Fertig! Bitte teste die Anwendung in Production."

