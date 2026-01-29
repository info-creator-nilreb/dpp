# Migration für Supabase ausführen

## Option 1: Prisma Migrate Deploy (Empfohlen)

### Schritt 1: Supabase Connection String holen

1. Gehe zu deinem Supabase Projekt: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Gehe zu **Settings** → **Database**
4. Scrolle zu **Connection string** → **URI**
5. Kopiere die Connection String (Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)

### Schritt 2: DATABASE_URL setzen

```bash
# Temporär für diesen Befehl (empfohlen)
DATABASE_URL="postgresql://postgres:[DEIN_PASSWORT]@[HOST]:5432/postgres" npx prisma migrate deploy

# Oder dauerhaft in .env Datei speichern
echo 'DATABASE_URL="postgresql://postgres:[DEIN_PASSWORT]@[HOST]:5432/postgres"' >> .env
npx prisma migrate deploy
```

**Wichtig:** Ersetze `[DEIN_PASSWORT]` und `[HOST]` mit deinen tatsächlichen Werten.

### Schritt 3: Prisma Client neu generieren

```bash
npx prisma generate
```

### Schritt 4: Server neu starten

```bash
# Stoppe den Server (Ctrl+C) und starte neu:
npm run dev
```

---

## Option 2: Supabase SQL Editor (Einfachste Methode)

### Schritt 1: SQL Editor öffnen

1. Gehe zu deinem Supabase Projekt: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Gehe zu **SQL Editor** (im linken Menü)

### Schritt 2: SQL ausführen

Kopiere den kompletten Inhalt der Migration-Datei und füge ihn in den SQL Editor ein:

**Datei:** `prisma/migrations/20260102000000_add_versioned_media/migration.sql`

**SQL-Code:**

```sql
-- Add versioned media support
-- This migration adds:
-- 1. DppVersionMedia table for version-bound media
-- 2. Extended DppMedia fields (role, blockId, fieldKey)

-- ============================================
-- 1. Extend DppMedia table with new fields
-- ============================================

-- Add role column (semantic role: primary_product_image, gallery_image, certificate, logo, etc.)
ALTER TABLE "dpp_media"
  ADD COLUMN IF NOT EXISTS "role" TEXT;

-- Add blockId column (optional: ID of the block this media belongs to)
ALTER TABLE "dpp_media"
  ADD COLUMN IF NOT EXISTS "blockId" TEXT;

-- Add fieldKey column (optional: Key of the file field in the block)
ALTER TABLE "dpp_media"
  ADD COLUMN IF NOT EXISTS "fieldKey" TEXT;

-- Create indexes for DppMedia
CREATE INDEX IF NOT EXISTS "dpp_media_dppId_role_idx" ON "dpp_media"("dppId", "role");
CREATE INDEX IF NOT EXISTS "dpp_media_blockId_idx" ON "dpp_media"("blockId");

-- ============================================
-- 2. Create DppVersionMedia table
-- ============================================

CREATE TABLE IF NOT EXISTS "dpp_version_media" (
  "id" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageUrl" TEXT NOT NULL,
  "role" TEXT,
  "blockId" TEXT,
  "fieldKey" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dpp_version_media_pkey" PRIMARY KEY ("id")
);

-- Create indexes for DppVersionMedia
CREATE INDEX IF NOT EXISTS "dpp_version_media_versionId_idx" ON "dpp_version_media"("versionId");
CREATE INDEX IF NOT EXISTS "dpp_version_media_versionId_role_idx" ON "dpp_version_media"("versionId", "role");
CREATE INDEX IF NOT EXISTS "dpp_version_media_blockId_idx" ON "dpp_version_media"("blockId");

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dpp_version_media_versionId_fkey'
  ) THEN
    ALTER TABLE "dpp_version_media"
    ADD CONSTRAINT "dpp_version_media_versionId_fkey" 
    FOREIGN KEY ("versionId") 
    REFERENCES "dpp_versions"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
  END IF;
END $$;
```

3. Klicke auf **Run** (oder drücke `Ctrl+Enter` / `Cmd+Enter`)

### Schritt 3: Prisma Client neu generieren

```bash
npx prisma generate
```

### Schritt 4: Server neu starten

```bash
# Stoppe den Server (Ctrl+C) und starte neu:
npm run dev
```

---

## Option 3: psql Command Line

### Schritt 1: Connection String vorbereiten

```bash
# Setze die DATABASE_URL
export DATABASE_URL="postgresql://postgres:[DEIN_PASSWORT]@[HOST]:5432/postgres"
```

### Schritt 2: Migration ausführen

```bash
# Mit psql
psql $DATABASE_URL -f prisma/migrations/20260102000000_add_versioned_media/migration.sql

# Oder direkt mit Connection String
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f prisma/migrations/20260102000000_add_versioned_media/migration.sql
```

### Schritt 3: Prisma Client neu generieren

```bash
npx prisma generate
```

---

## Verifikation nach der Migration

### In Supabase SQL Editor:

```sql
-- Prüfe, ob die Spalten existieren
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dpp_media'
ORDER BY ordinal_position;

-- Prüfe bestehende Daten (sollten NULL in neuen Spalten haben)
SELECT id, fileName, role, blockId, fieldKey
FROM dpp_media
LIMIT 5;

-- Prüfe, ob die neue Tabelle existiert
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'dpp_version_media';
```

### Mit Prisma:

```bash
# Prüfe Migrations-Status
npx prisma migrate status

# Validiere Schema
npx prisma validate
```

---

## Supabase-spezifische Hinweise

### Connection String Format

Supabase Connection String sieht normalerweise so aus:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Wichtig:**
- Port `6543` = Connection Pooler (empfohlen für Production)
- Port `5432` = Direct Connection (für Migrationen manchmal besser)

### Pooler vs. Direct Connection

Für Migrationen kann es besser sein, die Direct Connection zu verwenden:

```bash
# Direct Connection (Port 5432)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npx prisma migrate deploy
```

### SSL Mode

Supabase erfordert SSL. Füge `?sslmode=require` hinzu:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require" npx prisma migrate deploy
```

---

## Troubleshooting

### Fehler: "SSL connection required"

Lösung: Füge `?sslmode=require` zur Connection String hinzu.

### Fehler: "Connection timeout"

Lösung: 
- Prüfe, ob deine IP-Adresse in Supabase erlaubt ist (Settings → Database → Connection Pooling)
- Oder verwende den SQL Editor in Supabase (Option 2)

### Fehler: "Password authentication failed"

Lösung:
- Prüfe, ob das Passwort korrekt ist
- Hole das Passwort aus Supabase Settings → Database → Database password

### Fehler: "Table does not exist"

Lösung:
- Stelle sicher, dass alle vorherigen Migrationen ausgeführt wurden
- Prüfe mit `npx prisma migrate status`

---

## Zusammenfassung - Schnellstart

**Einfachste Methode (empfohlen):**

1. Öffne Supabase SQL Editor
2. Kopiere den SQL-Code aus `prisma/migrations/20260102000000_add_versioned_media/migration.sql`
3. Führe ihn aus
4. Führe aus: `npx prisma generate`
5. Starte Server neu

**Oder mit Prisma:**

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require" npx prisma migrate deploy
npx prisma generate
```

---

## ⚠️ WICHTIG: Migration ist sicher!

- ✅ **Keine Daten werden überschrieben**
- ✅ **Nur neue Spalten werden hinzugefügt**
- ✅ **Bestehende Daten bleiben unverändert**
- ✅ **Migration ist idempotent** (kann mehrfach ausgeführt werden)
