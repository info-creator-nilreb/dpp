# Dev-Datenbank Wiederherstellung

## ⚠️ WICHTIG: Datenverlust durch Migration

Die Dev-Datenbank wurde durch die Migration geleert. Ohne Backup können die Daten nicht automatisch wiederhergestellt werden.

## Optionen zur Wiederherstellung

### Option 1: Daten aus Production kopieren (falls vorhanden)

Wenn die Production-Datenbank noch Daten enthält, können wir diese in die Dev-Datenbank kopieren:

```bash
# 1. Production-Datenbank exportieren
export PROD_DATABASE_URL="postgresql://...@db.fnfuklgbsojzdfnmrfad.supabase.co:5432/postgres?sslmode=require"
pg_dump $PROD_DATABASE_URL > prod_backup.sql

# 2. In Dev-Datenbank importieren (ACHTUNG: Überschreibt alle Daten!)
export DEV_DATABASE_URL="postgresql://...@db.jhxdwgnvmbnxjwiaodtj.supabase.co:5432/postgres?sslmode=require"
psql $DEV_DATABASE_URL < prod_backup.sql
```

### Option 2: Supabase Dashboard Backup

1. Öffne das Supabase Dashboard für die Dev-Datenbank
2. Prüfe, ob automatische Backups vorhanden sind
3. Stelle ein Backup wieder her

### Option 3: Manuelle Datenwiederherstellung

Falls du ein manuelles Backup hast:
1. Stelle sicher, dass das Schema aktuell ist (Migrationen angewendet)
2. Importiere das Backup in die Dev-Datenbank

### Option 4: Neu aufsetzen (wenn keine wichtigen Daten vorhanden waren)

Falls die Dev-Datenbank nur Testdaten enthielt:
1. Erstelle neue Testdaten manuell
2. Verwende Seed-Scripts für Initial-Daten

## Nächste Schritte

Bitte teile mir mit:
1. Gibt es ein Backup der Dev-Datenbank?
2. Sollen wir Daten aus Production kopieren?
3. Oder sollen wir die Dev-Datenbank neu aufsetzen?


