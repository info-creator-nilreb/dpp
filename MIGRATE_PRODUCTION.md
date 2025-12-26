# Produktions-Migration ausführen

## Schritt 1: Git Push (lokal ausführen)

Der Push muss lokal ausgeführt werden, da die Sandbox SSL-Probleme hat:

```bash
git push
```

## Schritt 2: Produktions-Migration ausführen

### Option A: Mit Produktions-DATABASE_URL (empfohlen)

```bash
# Produktions-DATABASE_URL setzen
export DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Migration ausführen
npx prisma migrate deploy
```

### Option B: Mit .env.production

```bash
# .env.production erstellen (falls nicht vorhanden)
echo "DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require" > .env.production

# Migration ausführen
npx prisma migrate deploy
```

### Option C: Direkt mit psql (falls Prisma nicht verfügbar)

```bash
# SQL-Datei direkt ausführen
psql $DATABASE_URL < prisma/migrations/20251225010453_add_trial_system/migration.sql
```

## Schritt 3: Migration prüfen

```bash
# Status prüfen
npx prisma migrate status

# Oder direkt in der Datenbank prüfen
psql $DATABASE_URL -c "\d feature_registry"
psql $DATABASE_URL -c "\d subscriptions"
```

## Wichtige Hinweise

- ✅ Migration ist idempotent (kann mehrfach ausgeführt werden)
- ✅ Nur Schema-Änderungen, keine Datenänderungen
- ✅ Bestehende Daten bleiben unverändert
- ⚠️ Backup vorher erstellen (empfohlen)

## Was wird geändert?

1. **Subscriptions Tabelle:**
   - Neue Spalten: `trialExpiresAt`, `trialStartedAt` (nullable)
   - DEFAULT-Werte: `plan = 'basic'`, `status = 'trial_active'` (nur für neue Einträge)

2. **Neue Tabellen:**
   - `feature_registry` - Feature Registry
   - `block_types` - Block-Typen
   - `dpp_content` - DPP Content (CMS)

3. **Foreign Keys:**
   - Alle verwenden `IF NOT EXISTS` - sicher

