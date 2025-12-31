#!/bin/bash

# Script zum manuellen Anwenden der Phase 1 Migration
# Falls prisma migrate dev nicht funktioniert

set -e

echo "=========================================="
echo "Phase 1 Migration - Manuelles Anwenden"
echo "=========================================="
echo ""

# Prüfe DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL ist nicht gesetzt"
  echo "💡 Bitte DATABASE_URL in .env setzen oder exportieren"
  exit 1
fi

echo "✅ DATABASE_URL ist gesetzt"
echo ""

# Prüfe ob Migration-Datei existiert
MIGRATION_FILE="prisma/migrations/20250101000000_phase1_organization_user_management/migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration-Datei nicht gefunden: $MIGRATION_FILE"
  exit 1
fi

echo "✅ Migration-Datei gefunden"
echo ""

# Frage nach Bestätigung
read -p "⚠️  Möchtest du die Migration jetzt anwenden? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Migration abgebrochen."
  exit 0
fi

echo ""
echo "🚀 Wende Migration an..."
echo ""

# Versuche Migration mit Prisma anzuwenden
if command -v npx &> /dev/null; then
  echo "📋 Verwende Prisma migrate deploy..."
  npx prisma migrate deploy --schema prisma/schema.prisma || {
    echo ""
    echo "⚠️  Prisma migrate deploy fehlgeschlagen"
    echo "💡 Versuche alternative Methode..."
    echo ""
    
    # Alternative: Markiere Migration als angewendet (wenn bereits manuell angewendet)
    read -p "Wurde die Migration bereits manuell angewendet? (yes/no): " manual
    if [ "$manual" == "yes" ]; then
      echo "📋 Markiere Migration als angewendet..."
      npx prisma migrate resolve --applied 20250101000000_phase1_organization_user_management || echo "⚠️  Konnte Migration nicht als angewendet markieren"
    fi
  }
else
  echo "❌ npx nicht gefunden"
  exit 1
fi

echo ""
echo "✅ Migration abgeschlossen!"
echo ""
echo "📦 Generiere Prisma Client neu..."
npx prisma generate

echo ""
echo "✅ Fertig!"

