#!/bin/bash

# Migration ausschließlich auf Development-Datenbank anwenden
# Verwendet migrate deploy, um Shadow-Datenbank zu umgehen

set -e

DEV_DB_ID="jhxdwgnvmbnxjwiaodtj"
PROD_DB_ID="fnfuklgbsojzdfnmrfad"

echo "=========================================="
echo "Migration auf Development-Datenbank"
echo "=========================================="
echo ""

# Lade .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Prüfe ob DEV_DATABASE_URL gesetzt ist
if [ -n "$DEV_DATABASE_URL" ]; then
    echo "✅ Verwende DEV_DATABASE_URL"
    export DATABASE_URL="$DEV_DATABASE_URL"
elif [ -n "$DATABASE_URL" ]; then
    # Prüfe ob DATABASE_URL auf Production zeigt
    if [[ "$DATABASE_URL" == *"$PROD_DB_ID"* ]]; then
        echo "❌ FEHLER: DATABASE_URL zeigt auf Production-Datenbank!"
        echo "   Production-DB-ID erkannt: $PROD_DB_ID"
        echo ""
        echo "💡 Bitte DEV_DATABASE_URL in .env setzen:"
        echo "   DEV_DATABASE_URL=\"postgresql://...@db.$DEV_DB_ID.supabase.co:5432/postgres?sslmode=require\""
        exit 1
    fi
    
    # Prüfe ob DATABASE_URL auf Dev zeigt
    if [[ "$DATABASE_URL" == *"$DEV_DB_ID"* ]]; then
        echo "✅ DATABASE_URL zeigt auf Development-Datenbank"
    else
        echo "⚠️  WARNUNG: Kann nicht bestätigen, dass DATABASE_URL auf Dev zeigt"
        echo "   Erwartete Dev-DB-ID: $DEV_DB_ID"
        echo "   Gefundene URL: ${DATABASE_URL:0:50}..."
        echo ""
        read -p "Fortfahren? (j/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "❌ FEHLER: Weder DEV_DATABASE_URL noch DATABASE_URL gesetzt"
    echo ""
    echo "💡 Bitte in .env setzen:"
    echo "   DEV_DATABASE_URL=\"postgresql://...@db.$DEV_DB_ID.supabase.co:5432/postgres?sslmode=require\""
    exit 1
fi

echo ""
echo "📋 Prüfe Migrations-Status..."
echo ""

# Prüfe Migrations-Status
npx prisma migrate status || true

echo ""
echo "🚀 Wende Migrationen an (nur Schema, keine Datenüberschreibung)..."
echo ""

# Wende Migrationen an (umgeht Shadow-Datenbank)
npx prisma migrate deploy

echo ""
echo "✅ Migration erfolgreich auf Development-Datenbank angewendet!"
echo ""
echo "📊 Verifiziere Schema..."
npx prisma db pull --force || true

echo ""
echo "🎉 Fertig!"

