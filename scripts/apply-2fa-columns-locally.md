# Fehlende 2FA-Spalten lokal anwenden

Wenn beim Login erscheint: **"The column `users.twoFactorMethod` does not exist"**, fehlt die Migration in deiner lokalen DB.

## Option A: SQL einmalig ausführen (ohne Prisma migrate)

Verbinde dich mit deiner **lokalen** Datenbank (psql, TablePlus, DBeaver, etc.) und führe aus:

```sql
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "twoFactorMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "email2FACodeHash" TEXT,
  ADD COLUMN IF NOT EXISTS "email2FACodeExpiresAt" TIMESTAMP(3);
```

Danach Login erneut versuchen.

## Option B: Prisma Migrate (mit DIRECT_URL)

1. In `.env` **DIRECT_URL** setzen (lokal meist identisch mit DATABASE_URL):
   ```env
   DIRECT_URL="postgresql://user:password@localhost:5432/dbname"
   ```
   (Werte aus deiner DATABASE_URL übernehmen.)

2. Migration ausführen (ohne Safe-Wrapper, da dieser bei Supabase-URL blockiert):
   ```bash
   npx prisma migrate deploy
   ```

3. Wenn deine DATABASE_URL auf eine **lokale** Postgres-Instanz zeigt (localhost), kannst du stattdessen den Wrapper nutzen – er setzt DIRECT_URL automatisch:
   ```bash
   ./scripts/safe-prisma-wrapper.sh migrate deploy
   ```
