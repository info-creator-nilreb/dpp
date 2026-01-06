#!/bin/bash

# Migration Script für Password Protection Config Tabelle
# Erstellt nur die Tabelle, überschreibt keine Daten

set -e

echo "=========================================="
echo "Production Migration: Password Protection Config"
echo "=========================================="
echo ""

# Prüfe ob DATABASE_URL gesetzt ist
if [ -z "$DATABASE_URL" ]; then
    echo "❌ FEHLER: DATABASE_URL ist nicht gesetzt!"
    echo ""
    echo "Bitte setze die Production DATABASE_URL:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "Oder verwende:"
    echo "  DATABASE_URL='...' ./run-prod-migration-password-protection.sh"
    exit 1
fi

echo "✅ DATABASE_URL ist gesetzt"
echo ""

# Zeige Migration-Status
echo "📊 Prüfe Migrations-Status..."
npx prisma migrate status || true

echo ""
echo "🚀 Führe Migration aus..."
echo "   Migration: 20260104205018_add_password_protection_config"
echo "   Erstellt: Tabelle 'password_protection_config'"
echo "   Sicherheit: CREATE TABLE IF NOT EXISTS (überschreibt nichts)"
echo ""

# Führe Migration aus
npx prisma migrate deploy

echo ""
echo "✅ Migration erfolgreich ausgeführt!"
echo ""
echo "📦 Generiere Prisma Client..."
npx prisma generate

echo ""
echo "✅ Fertig! Die Tabelle 'password_protection_config' wurde erstellt."
echo ""
echo "💡 Nächste Schritte:"
echo "   1. Öffne /super-admin/settings in der Anwendung"
echo "   2. Konfiguriere das Password Protection"
echo "   3. Setze das Passwort und aktiviere den Schutz"

