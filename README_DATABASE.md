# 🛡️ Datenbank-Sicherheit - Schnellstart

## Wichtig: Schutz vor versehentlichen Production-Änderungen

Dieses Projekt hat **automatische Safeguards**, die verhindern, dass Datenbankänderungen versehentlich in die Produktionsdatenbank gelangen.

## ✅ Sichere Befehle (für lokale Entwicklung)

```bash
# Prüfe Datenbank-Umgebung
npm run db:check

# Schema pushen (nur Development)
npm run db:push

# Migration erstellen (nur Development)
npm run db:migrate:dev
```

## 📐 Regel: Nur ergänzende Migrationen

**Migrationen dürfen keine bestehenden Daten überschreiben.** Es sind nur ergänzende Änderungen erlaubt:

- ✅ **Erlaubt:** Neue Tabellen anlegen, neue Spalten hinzufügen (`ADD COLUMN`), neue Indizes
- ❌ **Nicht erlaubt:** Bestehende Daten per `UPDATE`/`DELETE` ändern, Spalten/Tabellen löschen (`DROP`), Daten überschreiben

So bleiben bestehende Daten unverändert; nur Schema wird erweitert.

## ⚠️ Production-Migrationen

**NUR über spezielle Scripts:**

```bash
# Mit Bestätigung und Backup-Check
./scripts/migrate-production.sh
```

## 📝 .env Konfiguration

```env
# Development-Datenbank (Standard)
DEV_DATABASE_URL="postgresql://...@dev-db...?sslmode=require"

# Production-Datenbank (NUR für explizite Migrationen)
PROD_DATABASE_URL="postgresql://...@prod-db...?sslmode=require"

# Standard (sollte auf Development zeigen)
DATABASE_URL="${DEV_DATABASE_URL}"
```

## 🚨 Was passiert bei versehentlichem Production-Zugriff?

Die Befehle werden **sofort blockiert** mit einer Fehlermeldung.

## 🔗 Supabase + Vercel (Connection-Pool-Limit)

Bei Fehlern wie `MaxClientsInSessionMode: max clients reached` in Vercel Production:

1. **Vercel Environment Variables** – zwei URLs setzen:
   - `DATABASE_URL`: Pooler (Port 6543) für Runtime  
     `postgresql://postgres:PASSWORD@db.XXX.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL`: Direct (Port 5432) für Migrations  
     `postgresql://postgres:PASSWORD@db.XXX.supabase.co:5432/postgres`

2. **Lokale Entwicklung** – in `.env.local`:
   - `DIRECT_URL` = gleiche URL wie `DATABASE_URL` (oder jeweils Port 5432)

## 📚 Vollständige Dokumentation

Siehe [DATABASE_SAFETY.md](./DATABASE_SAFETY.md) für detaillierte Informationen.

