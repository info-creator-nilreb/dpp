# Production Migration: Template Versioning Fields

## Migration ausführen

Die Migration muss in Production ausgeführt werden, um die neuen Template-Versionierungsfelder hinzuzufügen.

### Option 1: Prisma Migrate Deploy (Empfohlen)

**Wichtig:** Verwenden Sie **einfache Anführungszeichen** (`'`) um die DATABASE_URL, damit zsh das `!` nicht als History-Expansion interpretiert:

```bash
DATABASE_URL='postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:5432/postgres' npx prisma migrate deploy
```

**Alternativ:** Mit doppelten Anführungszeichen und escaped `!`:

```bash
DATABASE_URL="postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207\!s@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" npx prisma migrate deploy
```

### Option 2: SQL direkt ausführen

Falls Prisma Migrate nicht funktioniert, können Sie die SQL-Datei direkt in der Production-Datenbank ausführen (z.B. im Supabase SQL Editor):

Siehe: `prisma/migrations/20251222170000_add_template_versioning_fields/migration.sql`

Oder führen Sie dieses SQL aus:

```sql
-- AlterTable: Make category NOT NULL (if it was nullable before)
-- First update any NULL categories to a default value
UPDATE "templates" SET "category" = 'OTHER' WHERE "category" IS NULL;

-- Then alter column to NOT NULL if it's not already
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'templates' 
    AND column_name = 'category' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "templates" ALTER COLUMN "category" SET NOT NULL;
  END IF;
END $$;

-- AlterTable: Add versioning fields to Template
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "supersedesVersion" INTEGER;

-- AlterTable: Add versioning fields to TemplateField
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "regulatoryRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "introducedInVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "deprecatedInVersion" INTEGER;

-- Update existing records: Set introducedInVersion to 1 for all existing fields
UPDATE "template_fields" SET "introducedInVersion" = 1 WHERE "introducedInVersion" IS NULL;

-- Update unique constraint on templates table
-- Remove old constraint if it exists (category, version, status)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'templates_category_version_status_key'
  ) THEN
    ALTER TABLE "templates" DROP CONSTRAINT "templates_category_version_status_key";
  END IF;
END $$;

-- Add new unique constraint (category, version) if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'templates_category_version_key'
  ) THEN
    ALTER TABLE "templates" ADD CONSTRAINT "templates_category_version_key" UNIQUE ("category", "version");
  END IF;
END $$;

-- Add index for category and status combination
CREATE INDEX IF NOT EXISTS "templates_category_status_idx" ON "templates"("category", "status");
```

### Nach der Migration

Nach erfolgreicher Migration:

1. Prisma Client regenerieren (wird normalerweise beim Build automatisch gemacht):
   ```bash
   npx prisma generate
   ```

2. Server neu starten (falls nötig)

## Wichtige Hinweise

- Die Migration ist **idempotent** - sie kann mehrfach ausgeführt werden ohne Probleme
- Alle `ALTER TABLE` Statements verwenden `IF NOT EXISTS` oder `IF EXISTS` Checks
- Bestehende Daten werden nicht gelöscht oder verändert (außer NULL-Kategorien werden auf 'OTHER' gesetzt)
