#!/usr/bin/env bash
# Führt Prisma migrate deploy gegen die in .env hinterlegte DATABASE_URL aus (lokal/Entwicklung).
# Setzt DIRECT_URL automatisch aus DATABASE_URL, falls nicht gesetzt.

set -e

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL ist in .env nicht gesetzt."
  exit 1
fi

export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"
echo "▶ Migrationen anwenden (DATABASE_URL aus .env, DIRECT_URL=${DIRECT_URL:+gesetzt})..."
npx prisma migrate deploy
