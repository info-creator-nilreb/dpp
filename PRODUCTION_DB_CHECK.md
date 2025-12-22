# Production Datenbank prüfen

## Problem
Fehler "The table `public.super_admins` does not exist" erscheint in Production, obwohl Migration lokal erfolgreich war.

## Lösung 1: Prisma Studio mit Production DATABASE_URL öffnen

1. **Production DATABASE_URL von Vercel kopieren:**
   - Vercel Dashboard → Projekt → Settings → Environment Variables
   - `DATABASE_URL` (Production) kopieren

2. **Prisma Studio mit Production DB öffnen:**
   ```bash
   DATABASE_URL="postgresql://..." npx prisma studio
   ```

3. **Im Browser prüfen:**
   - Öffnet sich unter `http://localhost:5555`
   - Prüfen ob folgende Tabellen existieren:
     - `super_admins`
     - `super_admin_2fa`
     - `super_admin_sessions`
     - `audit_logs`

## Lösung 2: Check-Script mit Production DATABASE_URL ausführen

```bash
DATABASE_URL="postgresql://..." node scripts/check-super-admin-tables.mjs
```

## Lösung 3: Migration direkt in Production ausführen

```bash
# Production DATABASE_URL setzen
export DATABASE_URL="postgresql://..."

# Migration ausführen
npx prisma migrate deploy
```

## Wichtig
- Lokale Datenbank ≠ Production Datenbank
- Production hat eine separate `DATABASE_URL`
- Migration muss separat in Production ausgeführt werden

