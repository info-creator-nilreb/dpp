# Production Migration: Password Protection Config

## Problem

Die Tabelle `password_protection_config` existiert nicht in der Produktions-Datenbank, was zu folgendem Fehler führt:

```
PrismaClientKnownRequestError: 
The table `public.password_protection_config` does not exist in the current database.
```

## Lösung: Migration in Production ausführen

### Option 1: Prisma Migrate Deploy (Empfohlen)

```bash
# Mit Production DATABASE_URL
DATABASE_URL='postgresql://user:password@host:port/database' npx prisma migrate deploy
```

Dies führt automatisch die ausstehende Migration `20260104205018_add_password_protection_config` aus.

### Option 2: Manuelle SQL-Ausführung

Falls `prisma migrate deploy` nicht verfügbar ist, kann die SQL-Datei direkt ausgeführt werden:

```bash
# Mit psql
psql $DATABASE_URL -f prisma/migrations/20260104205018_add_password_protection_config/migration.sql

# Oder mit dem SQL-Inhalt direkt
psql $DATABASE_URL -c "
CREATE TABLE IF NOT EXISTS \"password_protection_config\" (
    \"id\" TEXT NOT NULL,
    \"passwordProtectionEnabled\" BOOLEAN NOT NULL DEFAULT false,
    \"passwordProtectionStartDate\" TIMESTAMP(3),
    \"passwordProtectionEndDate\" TIMESTAMP(3),
    \"passwordProtectionPasswordHash\" TEXT,
    \"passwordProtectionSessionTimeoutMinutes\" INTEGER NOT NULL DEFAULT 60,
    \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT now(),
    \"updatedBy\" TEXT,
    CONSTRAINT \"password_protection_config_pkey\" PRIMARY KEY (\"id\")
);
"
```

### Option 3: Mit dem Migration Script

Falls verfügbar:

```bash
./scripts/migrate-production.sh
```

## Was wird erstellt?

Die Migration erstellt eine neue Tabelle `password_protection_config` mit folgenden Feldern:

- `id` (TEXT, PRIMARY KEY)
- `passwordProtectionEnabled` (BOOLEAN, DEFAULT false)
- `passwordProtectionStartDate` (TIMESTAMP, nullable)
- `passwordProtectionEndDate` (TIMESTAMP, nullable)
- `passwordProtectionPasswordHash` (TEXT, nullable)
- `passwordProtectionSessionTimeoutMinutes` (INTEGER, DEFAULT 60)
- `updatedAt` (TIMESTAMP, DEFAULT now())
- `updatedBy` (TEXT, nullable)

## Sicherheit

✅ Die Migration ist sicher:
- Verwendet `CREATE TABLE IF NOT EXISTS` - kann mehrfach ausgeführt werden
- Erstellt nur eine neue Tabelle, ändert keine bestehenden Daten
- Keine Foreign Keys zu anderen Tabellen

## Nach der Migration

1. **Prisma Client regenerieren** (falls nötig):
   ```bash
   npx prisma generate
   ```

2. **Migration-Status prüfen**:
   ```bash
   npx prisma migrate status
   ```

3. **Tabelle verifizieren**:
   ```bash
   psql $DATABASE_URL -c "\d password_protection_config"
   ```

## Initialisierung der Tabelle

Nach der Migration ist die Tabelle leer. Die Password Protection kann über die Super Admin Settings Seite konfiguriert werden:

- URL: `/super-admin/settings`
- Dort kann das Passwort gesetzt und der Schutz aktiviert werden

## Rollback (falls nötig)

Falls die Migration zurückgerollt werden muss:

```sql
DROP TABLE IF EXISTS "password_protection_config";
```

**Wichtig:** Dies löscht alle Konfigurationen! Nur bei Bedarf ausführen.

