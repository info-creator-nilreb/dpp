#!/bin/bash

# Script to apply versioned media migration safely
# Uses prisma migrate deploy which applies migrations without reset

set -e

echo "📦 Applying versioned media migration (safe mode - no data loss)..."

# Check database environment first
if ! ./scripts/check-database-environment.sh; then
  echo "❌ Database check failed - aborting"
  exit 1
fi

# Use prisma migrate deploy (safe for existing databases)
# This applies only pending migrations without resetting
echo "🔧 Applying migration..."
./node_modules/.bin/prisma migrate deploy

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npx prisma generate"
echo "2. Restart your dev server"
