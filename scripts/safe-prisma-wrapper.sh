#!/bin/bash

# Wrapper für Prisma-Befehle, der verhindert, dass versehentlich auf Production-Datenbanken zugegriffen wird
# Verwendung: ./scripts/safe-prisma-wrapper.sh db push
#            ./scripts/safe-prisma-wrapper.sh migrate dev

set -e

# Prüfe zuerst die Datenbank-Umgebung
if ! ./scripts/check-database-environment.sh; then
  echo ""
  echo "❌ Prisma-Befehl blockiert: DATABASE_URL zeigt auf Production!"
  echo ""
  echo "💡 Für lokale Entwicklung:"
  echo "   1. Setze DEV_DATABASE_URL in .env"
  echo "   2. Oder ändere DATABASE_URL auf Development-Datenbank"
  echo ""
  echo "💡 Für Production-Migrationen verwende:"
  echo "   ./scripts/migrate-production.sh"
  echo ""
  exit 1
fi

# Führe Prisma-Befehl aus
npx prisma "$@"

