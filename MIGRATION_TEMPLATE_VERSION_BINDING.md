# Migration: Template Version Binding (templateId/templateVersionId)

## Problem

Die Spalten `templateId` und `templateVersionId` fehlen in der Produktionsdatenbank, obwohl sie im Prisma Schema definiert sind.

**Fehler:**
```
The column `dpps.templateId` does not exist in the current database.
```

## Lösung: Migration ausführen

### Option 1: Prisma Migrate Deploy (Empfohlen)

Führt automatisch alle ausstehenden Migrationen aus:

```bash
# Mit Produktions-DATABASE_URL
DATABASE_URL='postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:5432/postgres' npx prisma migrate deploy
```

**Oder mit .env Datei:**
```bash
# .env Datei mit DATABASE_URL erstellen/bearbeiten
export DATABASE_URL='postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:5432/postgres'

# Migration ausführen
npx prisma migrate deploy
```

### Option 2: SQL direkt ausführen (Supabase SQL Editor)

Falls Prisma Migrate nicht verfügbar ist, können Sie die Migration direkt im Supabase SQL Editor ausführen:

```sql
-- Add templateId and templateVersionId to DPPs
-- These fields are immutable after DPP creation and bind a DPP to a specific template version

DO $$ 
BEGIN
  -- Add templateId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'dpps' AND column_name = 'templateId'
  ) THEN
    ALTER TABLE "dpps" ADD COLUMN "templateId" TEXT;
  END IF;

  -- Add templateVersionId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'dpps' AND column_name = 'templateVersionId'
  ) THEN
    ALTER TABLE "dpps" ADD COLUMN "templateVersionId" TEXT;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "dpps_templateId_idx" ON "dpps"("templateId");
CREATE INDEX IF NOT EXISTS "dpps_templateVersionId_idx" ON "dpps"("templateVersionId");
```

### Option 3: Mit Script

```bash
./scripts/migrate-production.sh
```

## Verifikation

Nach der Migration prüfen:

```bash
# Status prüfen
DATABASE_URL='postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:5432/postgres' npx prisma migrate status

# Oder direkt in der Datenbank
psql $DATABASE_URL -c "\d dpps" | grep templateId
```

## Wichtige Hinweise

- ✅ Migration ist **idempotent** (kann mehrfach ausgeführt werden)
- ✅ Nur Schema-Änderungen, keine Datenänderungen
- ✅ Bestehende Daten bleiben unverändert
- ✅ Spalten sind nullable (bestehende DPPs haben `NULL` Werte)
- ⚠️ Backup vorher erstellen (empfohlen)

## Was wird geändert?

1. **Neue Spalten in `dpps` Tabelle:**
   - `templateId` (TEXT, nullable) - Template logical identifier (category-based)
   - `templateVersionId` (TEXT, nullable) - Template ID (specific version identifier)

2. **Neue Indizes:**
   - `dpps_templateId_idx` - Index auf templateId
   - `dpps_templateVersionId_idx` - Index auf templateVersionId

## Nach der Migration

Nach erfolgreicher Migration sollte der Fehler verschwinden und die Anwendung wieder funktionieren.
