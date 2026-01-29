# Migration sicher ausführen - Schritt für Schritt

## ⚠️ WICHTIG: Migration ist 100% sicher!

Die Migration **überschreibt KEINE Daten**. Sie fügt nur **3 neue, optionale Spalten** hinzu.

## Problem
Die Spalte `dpp_media.role` existiert nicht in der Datenbank. Der Code benötigt diese Spalte für den Bildupload.

## Lösung: Migration ausführen

### Option 1: Prisma Migrate Deploy (Empfohlen)

```bash
# 1. Migration ausführen (fügt nur neue Spalten hinzu)
npx prisma migrate deploy

# 2. Prisma Client neu generieren
npx prisma generate

# 3. Server neu starten
# (Stoppe den Server mit Ctrl+C und starte neu mit npm run dev)
```

### Option 2: Manuelle SQL-Ausführung (falls Prisma nicht funktioniert)

Falls `npx prisma migrate deploy` nicht funktioniert, kannst du die SQL-Datei direkt ausführen:

```bash
# Mit psql (PostgreSQL)
psql $DATABASE_URL -f prisma/migrations/20260102000000_add_versioned_media/migration.sql

# Oder mit einem anderen PostgreSQL-Client
# Kopiere den Inhalt der Datei und führe ihn in deinem DB-Client aus
```

## Was die Migration macht

Die Migration fügt **nur** folgende Spalten zur `dpp_media` Tabelle hinzu:

```sql
ALTER TABLE "dpp_media"
  ADD COLUMN IF NOT EXISTS "role" TEXT;        -- Optional, nullable
  ADD COLUMN IF NOT EXISTS "blockId" TEXT;     -- Optional, nullable
  ADD COLUMN IF NOT EXISTS "fieldKey" TEXT;     -- Optional, nullable
```

**Wichtig:**
- ✅ `IF NOT EXISTS` bedeutet: Spalte wird nur hinzugefügt, wenn sie noch nicht existiert
- ✅ Alle Spalten sind **nullable** (können NULL sein)
- ✅ **Keine bestehenden Daten werden geändert**
- ✅ **Keine Daten werden gelöscht**
- ✅ **Keine Spalten werden entfernt**

## Verifikation nach der Migration

### 1. Prüfe, ob die Spalten existieren:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dpp_media'
ORDER BY ordinal_position;
```

Du solltest jetzt folgende Spalten sehen:
- `id`
- `dppId`
- `fileName`
- `fileType`
- `fileSize`
- `storageUrl`
- `role` ← **NEU**
- `blockId` ← **NEU**
- `fieldKey` ← **NEU**
- `uploadedAt`

### 2. Prüfe bestehende Daten:

```sql
SELECT id, fileName, role, blockId, fieldKey
FROM dpp_media
LIMIT 5;
```

Bestehende Datensätze sollten `NULL` in den neuen Spalten haben (das ist normal und korrekt).

## Falls die Migration bereits ausgeführt wurde

Falls die Spalten bereits existieren, aber der Fehler weiterhin auftritt:

1. **Prisma Client neu generieren:**
   ```bash
   npx prisma generate
   ```

2. **Server neu starten:**
   ```bash
   # Stoppe den Server (Ctrl+C)
   # Starte neu:
   npm run dev
   ```

3. **Prüfe Prisma Schema:**
   ```bash
   npx prisma validate
   ```

## Rollback (falls nötig)

Falls du die Spalten wieder entfernen möchtest (nicht empfohlen, da der Code sie benötigt):

```sql
ALTER TABLE "dpp_media"
  DROP COLUMN IF EXISTS "role",
  DROP COLUMN IF EXISTS "blockId",
  DROP COLUMN IF EXISTS "fieldKey";
```

**Aber:** Der Code wird dann nicht mehr funktionieren, da er diese Spalten benötigt.

## Zusammenfassung

✅ **Migration ist sicher** - keine Daten werden überschrieben  
✅ **Nur neue Spalten werden hinzugefügt**  
✅ **Bestehende Daten bleiben unverändert**  
✅ **Migration kann mehrfach ausgeführt werden** (idempotent)

**Führe einfach `npx prisma migrate deploy` aus - es ist sicher!**
