# Super Admin Production Fehlerbehebung

## Problem
Super Admin Login funktioniert nicht in Production - generischer Server Component Error.

## Mögliche Ursachen

### 1. Fehlende Umgebungsvariable
Die `SUPER_ADMIN_JWT_SECRET` Variable muss in Production gesetzt sein.

**In Vercel:**
- Settings → Environment Variables
- Variable: `SUPER_ADMIN_JWT_SECRET`
- Wert: Ein sicherer, zufälliger String (mindestens 32 Zeichen)
- WICHTIG: Muss in Production, Preview UND Development gesetzt sein

**Fallback:** Falls nicht gesetzt, wird `AUTH_SECRET` verwendet.

### 2. Prisma Client nicht regeneriert
Nach Migrationen muss Prisma Client regeneriert werden.

**Lösung:**
```bash
npx prisma generate
```

Vercel sollte dies automatisch beim Build machen, aber prüfen Sie die Build-Logs.

### 3. Session-Tabellen fehlen
Die Tabellen `super_admins`, `super_admin_sessions`, etc. müssen existieren.

**Prüfung:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'super_admin%'
ORDER BY table_name;
```

**Sollte zeigen:**
- super_admins
- super_admin_2fa
- super_admin_sessions
- audit_logs

### 4. Fehlende Super Admin Credentials
Es muss mindestens ein Super Admin in der Datenbank existieren.

**Prüfung:**
```sql
SELECT id, email, role, "isActive" FROM super_admins;
```

**Erstellen (falls fehlt):**
Siehe: `scripts/create-super-admin.mjs`

## Debugging-Schritte

1. **Vercel Build Logs prüfen:**
   - Deployment → Functions → View Logs
   - Nach Prisma-Fehlern suchen

2. **Vercel Function Logs prüfen:**
   - Real-time Logs in Vercel Dashboard
   - Nach Fehlermeldungen beim Login suchen

3. **Umgebungsvariablen prüfen:**
   - Vercel Dashboard → Settings → Environment Variables
   - Sicherstellen, dass `SUPER_ADMIN_JWT_SECRET` oder `AUTH_SECRET` gesetzt ist

4. **Database direkt prüfen:**
   - Supabase Dashboard → SQL Editor
   - Prüfen ob Tabellen existieren (siehe oben)

## Lokale vs. Production Unterschiede

**Lokales Problem (behoben):**
- Redirect-Loops durch Middleware
- Session nicht erkannt
- Prisma Client Proxy Probleme

**Production Problem (aktuell):**
- Generischer Server Component Error
- Möglicherweise Umgebungsvariable fehlt
- Möglicherweise Prisma Client nicht korrekt

## Nächste Schritte

1. Error-Handling wurde hinzugefügt (commit 6498b7f)
2. Prüfen Sie Vercel Environment Variables
3. Prüfen Sie Vercel Build Logs nach Prisma-Fehlern
4. Falls nötig, Prisma Client manuell regenerieren: `npx prisma generate`

