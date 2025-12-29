# Produktions-Datenbank Schema-Synchronisation

## Übersicht

Dieses Script synchronisiert das Schema (Tabellen und Felder) von der Dev-Datenbank zur Prod-Datenbank, **ohne Daten zu migrieren**.

- **Dev-Datenbank**: `jhxdwgnvmbnxjwiaodtj` (32 Tabellen)
- **Prod-Datenbank**: `fnfuklgbsojzdfnmrfad` (30 Tabellen → soll 32 werden)

## Wichtig

- ✅ **Nur Schema-Änderungen** werden angewendet (Tabellen, Spalten, Indizes)
- ❌ **Keine Daten** werden migriert
- ✅ Bestehende Daten in Prod bleiben unverändert

## Verwendung

### Option 1: Automatisches Script (empfohlen)

```bash
./scripts/sync-prod-schema-only.sh
```

Das Script:
1. Prüft die Tabellen-Anzahl in beiden Datenbanken
2. Zeigt Unterschiede an
3. Fragt nach Bestätigung
4. Wendet ausstehende Migrationen an (`prisma migrate deploy`)
5. Regeneriert Prisma Client
6. Verifiziert die Tabellen-Anzahl

### Option 2: Manuelle Schritte

```bash
# 1. Konstruiere Prod-Datenbank-URL
export PROD_DATABASE_URL="postgresql://...@db.fnfuklgbsojzdfnmrfad.supabase.co:5432/postgres?sslmode=require"

# 2. Prüfe Migrations-Status
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate status

# 3. Wende Migrationen an (nur Schema)
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy

# 4. Regeneriere Prisma Client
npx prisma generate

# 5. Verifiziere Tabellen-Anzahl
DATABASE_URL="$PROD_DATABASE_URL" npx tsx scripts/list-tables.ts
```

## Vergleich der Datenbanken

```bash
npx tsx scripts/verify-both-databases.ts
```

Zeigt:
- Tabellen-Anzahl in beiden Datenbanken
- Fehlende Tabellen in Prod
- Zusätzliche Tabellen in Prod

## Sicherheit

- Das Script verwendet `prisma migrate deploy`, das nur Schema-Änderungen anwendet
- Bestehende Daten werden **nicht** gelöscht oder geändert
- Neue Tabellen werden leer erstellt
- Neue Spalten werden mit Default-Werten oder NULL hinzugefügt

## Nach der Synchronisation

Nach erfolgreicher Synchronisation sollten beide Datenbanken:
- ✅ Die gleiche Anzahl Tabellen haben (32 inkl. `_prisma_migrations`)
- ✅ Die gleichen Spalten in allen Tabellen haben
- ✅ Die gleichen Indizes und Constraints haben

## Troubleshooting

### Fehler: "Migration already applied"
- Die Migration wurde bereits angewendet
- Verwende `npx prisma migrate resolve --applied <migration-name>` um sie als angewendet zu markieren

### Fehler: "Table already exists"
- Die Tabelle existiert bereits, aber möglicherweise mit anderen Spalten
- Prisma wird die Spalten-Differenzen automatisch beheben

### Fehler: "Permission denied"
- Prüfe die Datenbank-Credentials in der DATABASE_URL
- Stelle sicher, dass der User Schreibrechte hat

