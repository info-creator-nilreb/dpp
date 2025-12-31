#!/bin/bash

# Prüft, ob DATABASE_URL auf eine Production-Datenbank zeigt
# Verhindert versehentliche Änderungen an Production

set -e

# Production-Datenbank-IDs (Supabase)
PROD_DB_IDS=(
  "fnfuklgbsojzdfnmrfad"
  # Weitere Production-DB-IDs hier hinzufügen
)

# Production-Host-Patterns
PROD_HOST_PATTERNS=(
  "pooler.supabase.com"
  "supabase.co"
  # Weitere Production-Host-Patterns hier hinzufügen
)

# Lade DATABASE_URL
if [ -f .env ]; then
  # Lade DATABASE_URL sicher aus .env
  DATABASE_URL=$(grep -v '^#' .env | grep DATABASE_URL | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
  export DATABASE_URL
fi

DATABASE_URL="${DATABASE_URL:-${DEV_DATABASE_URL:-}}"

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL ist nicht gesetzt"
  exit 0  # Nicht blockieren, wenn nicht gesetzt
fi

# Prüfe auf Production-DB-IDs
for PROD_ID in "${PROD_DB_IDS[@]}"; do
  if [[ "$DATABASE_URL" == *"$PROD_ID"* ]]; then
    echo "❌ FEHLER: DATABASE_URL zeigt auf Production-Datenbank!"
    echo "   Production-DB-ID erkannt: $PROD_ID"
    echo ""
    echo "💡 Verwende DEV_DATABASE_URL für lokale Entwicklung:"
    echo "   export DEV_DATABASE_URL='postgresql://...@dev-db...'"
    echo ""
    echo "💡 Oder ändere DATABASE_URL in .env auf eine Development-Datenbank"
    exit 1
  fi
done

# Prüfe auf Production-Host-Patterns (nur wenn nicht explizit DEV-DB-ID vorhanden)
DEV_DB_ID="jhxdwgnvmbnxjwiaodtj"
if [[ "$DATABASE_URL" != *"$DEV_DB_ID"* ]]; then
  for PATTERN in "${PROD_HOST_PATTERNS[@]}"; do
    if [[ "$DATABASE_URL" == *"$PATTERN"* ]]; then
      echo "⚠️  WARNUNG: DATABASE_URL könnte auf Production zeigen!"
      echo "   Host-Pattern erkannt: $PATTERN"
      echo ""
      echo "💡 Bitte bestätige, dass dies eine Development-Datenbank ist"
      echo "   Oder verwende DEV_DATABASE_URL für lokale Entwicklung"
      exit 1
    fi
  done
fi

echo "✅ DATABASE_URL zeigt auf Development-Datenbank"
exit 0

