# Migration von Dev zu Production

## WICHTIG: Vorbereitung

1. **Backup der Production-Datenbank erstellen**
   ```bash
   # PostgreSQL Backup
   pg_dump -h <prod-host> -U <user> -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Umgebungsvariablen prüfen**
   - Die `DATABASE_URL` wird automatisch aus der `.env` Datei geladen
   - Stelle sicher, dass die `.env` Datei die Production-Datenbank-URL enthält
   - Format: `DATABASE_URL="postgresql://user:password@host:port/database"`

## Migrations-Status prüfen

```bash
# Prüfe, welche Migrationen bereits angewendet wurden
npx prisma migrate status
```

## Migrationen anwenden

### Option 1: Prisma Migrate Deploy (Empfohlen für Production)

```bash
# DATABASE_URL wird automatisch aus .env geladen
# Wende alle ausstehenden Migrationen an
npx prisma migrate deploy
```

**Oder mit dem automatischen Script:**
```bash
./scripts/migrate-production.sh
```

### Option 2: Manuelle Migration (falls nötig)

Falls `migrate deploy` nicht funktioniert, können die SQL-Dateien manuell ausgeführt werden:

```bash
# Alle Migrationen in chronologischer Reihenfolge
psql $DATABASE_URL -f prisma/migrations/20251216194622_init/migration.sql
psql $DATABASE_URL -f prisma/migrations/20251222131000_create_template_tables/migration.sql
# ... etc
```

## Nach der Migration

1. **Prisma Client neu generieren**
   ```bash
   npx prisma generate
   ```

2. **Migration-Status verifizieren**
   ```bash
   npx prisma migrate status
   ```

3. **Datenbank-Schema prüfen**
   ```bash
   npx prisma db pull
   npx prisma validate
   ```

## Rollback (falls nötig)

Falls etwas schief geht:
1. Stoppe die Anwendung
2. Stelle das Backup wieder her
3. Analysiere die Fehler
4. Korrigiere die Migrationen und versuche es erneut

