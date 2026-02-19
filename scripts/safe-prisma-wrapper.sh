#!/bin/bash

# Wrapper für Prisma-Befehle, der verhindert, dass versehentlich auf Production-Datenbanken zugegriffen wird
# Verwendung: ./scripts/safe-prisma-wrapper.sh db push
#            ./scripts/safe-prisma-wrapper.sh migrate dev

set -e

# .env laden (falls vorhanden), damit DATABASE_URL und ggf. DIRECT_URL gesetzt sind
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Prisma verlangt DIRECT_URL im Schema; für lokale Dev reicht Fallback auf DATABASE_URL
if [ -z "$DIRECT_URL" ] && [ -n "$DATABASE_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

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

