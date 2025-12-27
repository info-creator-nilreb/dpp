#!/bin/bash

# Script zum Anwenden der fehlenden Tabellen auf die Produktionsdatenbank
# 
# Verwendung:
#   ./scripts/apply-missing-tables-to-production.sh
#
# Oder mit expliziter DATABASE_URL:
#   DATABASE_URL="postgresql://user:password@host:port/database" ./scripts/apply-missing-tables-to-production.sh

set -e  # Exit on error

echo "=========================================="
echo "Migration: Fehlende Tabellen zur Produktionsdatenbank hinzufügen"
echo "=========================================="
echo ""

# Prüfe ob DATABASE_URL gesetzt ist
if [ -z "$DATABASE_URL" ]; then
    echo "FEHLER: DATABASE_URL Umgebungsvariable ist nicht gesetzt."
    echo ""
    echo "Bitte setze die DATABASE_URL für die Produktionsdatenbank:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "Oder führe das Script mit der URL aus:"
    echo "  DATABASE_URL='postgresql://...' ./scripts/apply-missing-tables-to-production.sh"
    exit 1
fi

echo "Verwende DATABASE_URL: ${DATABASE_URL%%@*}" # Zeige nur User@host, nicht das Passwort
echo ""

# Prüfe ob psql verfügbar ist
if ! command -v psql &> /dev/null; then
    echo "FEHLER: psql ist nicht installiert oder nicht im PATH."
    echo "Bitte installiere PostgreSQL Client Tools."
    exit 1
fi

# Wende die Migration an
echo "Wende Migration an..."
psql "$DATABASE_URL" -f scripts/apply-missing-tables-to-production.sql

echo ""
echo "=========================================="
echo "Migration erfolgreich abgeschlossen!"
echo "=========================================="
echo ""
echo "Die folgenden Tabellen wurden erstellt (falls sie nicht bereits existierten):"
echo "  - feature_registry"
echo "  - block_types"
echo "  - dpp_content"
echo ""
echo "Bitte prüfe die Tabellenstruktur mit:"
echo "  psql \"\$DATABASE_URL\" -c \"\\d feature_registry\""
echo "  psql \"\$DATABASE_URL\" -c \"\\d block_types\""
echo "  psql \"\$DATABASE_URL\" -c \"\\d dpp_content\""
echo ""

