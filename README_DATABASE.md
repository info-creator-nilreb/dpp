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

## 📚 Vollständige Dokumentation

Siehe [DATABASE_SAFETY.md](./DATABASE_SAFETY.md) für detaillierte Informationen.

