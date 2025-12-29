#!/bin/bash

# Migration Script für Production
# WICHTIG: Vor dem Ausführen ein Backup erstellen!

set -e  # Exit on error

echo "=========================================="
echo "Production Migration Script"
echo "=========================================="
echo ""

# Lade .env Datei falls vorhanden
if [ -f .env ]; then
    echo "📄 Lade .env Datei..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ .env Datei geladen"
else
    echo "⚠️  Keine .env Datei gefunden"
fi

# Prüfe ob DATABASE_URL gesetzt ist
if [ -z "$DATABASE_URL" ]; then
    echo "❌ FEHLER: DATABASE_URL ist nicht gesetzt!"
    echo "Bitte setze die Umgebungsvariable in der .env Datei oder:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

echo "✅ DATABASE_URL ist gesetzt"
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

