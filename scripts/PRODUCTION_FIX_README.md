# Production Fix: dpp_media.blockId und fieldId Spalten

## Problem
Die Spalten `blockId` und `fieldId` fehlen in der Produktionsdatenbank, obwohl die Migration `20250105000000_add_block_field_to_media` als ausgeführt markiert ist.

## Lösung

### 1. SQL-Script direkt ausführen
Das Script `scripts/fix-dpp-media-production.sql` wurde bereits ausgeführt und sollte die Spalten hinzugefügt haben.

### 2. Prisma Client neu generieren
Der Prisma Client wurde lokal neu generiert. **WICHTIG:** In der Produktion (Vercel) muss ein neues Deployment getriggert werden, damit der Prisma Client mit den neuen Spalten neu generiert wird.

### 3. Verifikation
Um zu prüfen, ob die Spalten existieren, führe folgendes SQL aus:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'dpp_media'
AND column_name IN ('blockId', 'fieldId');
```

## Nächste Schritte
1. **Neues Deployment in Vercel triggern** - Dies ist kritisch, damit der Prisma Client in der Produktion neu generiert wird
2. Nach dem Deployment sollte der Fehler behoben sein

## Alternative: Manuelles SQL in Supabase
Falls das Problem weiterhin besteht, kann das SQL direkt in Supabase ausgeführt werden:

```sql
ALTER TABLE "dpp_media" ADD COLUMN IF NOT EXISTS "blockId" TEXT;
ALTER TABLE "dpp_media" ADD COLUMN IF NOT EXISTS "fieldId" TEXT;
CREATE INDEX IF NOT EXISTS "dpp_media_dppId_blockId_fieldId_idx" ON "dpp_media"("dppId", "blockId", "fieldId");
```

