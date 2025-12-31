# Datenbank-Sicherheit: Schutz vor versehentlichen Production-Änderungen

## 🛡️ Übersicht

Dieses Projekt enthält Safeguards, die verhindern, dass Datenbankänderungen versehentlich in die Produktionsdatenbank gelangen.

## ⚠️ Wichtige Regeln

1. **NIEMALS** `prisma db push` direkt auf Production-Datenbanken ausführen
2. **NIEMALS** `prisma migrate dev` auf Production-Datenbanken ausführen
3. **IMMER** Production-Migrationen über die speziellen Scripts ausführen
4. **IMMER** ein Backup erstellen, bevor Production-Migrationen ausgeführt werden

## 🔍 Datenbank-Umgebungen

### Development-Datenbank
- **ID**: `jhxdwgnvmbnxjwiaodtj`
- **Verwendung**: Lokale Entwicklung, Tests
- **Sicher**: `prisma db push` und `prisma migrate dev` sind hier erlaubt

### Production-Datenbank
- **ID**: `fnfuklgbsojzdfnmrfad`
- **Verwendung**: Live-Produktion
- **Geschützt**: Automatische Prüfung verhindert versehentliche Änderungen

## 🚀 Verwendung

### Lokale Entwicklung (Development-Datenbank)

#### Option 1: Normale Prisma-Befehle (mit Sicherheitsprüfung)
```bash
# Prüft automatisch, ob DATABASE_URL auf Production zeigt
./scripts/safe-prisma-wrapper.sh db push
./scripts/safe-prisma-wrapper.sh migrate dev
```

#### Option 2: Direkte Prisma-Befehle (wenn sicher)
```bash
# Nur wenn DATABASE_URL auf Development-Datenbank zeigt
npx prisma db push
npx prisma migrate dev
```

#### Option 3: Manuelle Prüfung
```bash
# Prüfe vorher, ob DATABASE_URL sicher ist
./scripts/check-database-environment.sh
```

### Production-Migrationen

**NUR über spezielle Scripts:**

```bash
# Mit Bestätigung und Backup-Check
./scripts/migrate-production.sh

# Oder mit expliziter Production-DATABASE_URL
export DATABASE_URL="postgresql://...@prod-db..."
./scripts/migrate-production.sh
```

## 🔒 Sicherheitsprüfungen

### Automatische Prüfung

Die Scripts prüfen automatisch:
- ✅ Ob `DATABASE_URL` eine Production-DB-ID enthält
- ✅ Ob `DATABASE_URL` auf Production-Hosts zeigt
- ✅ Ob explizit `DEV_DATABASE_URL` verwendet wird

### Manuelle Prüfung

```bash
# Prüfe aktuelle DATABASE_URL
./scripts/check-database-environment.sh
```

## 📝 .env Konfiguration

### Empfohlene Struktur

```env
# Development-Datenbank (Standard für lokale Entwicklung)
DEV_DATABASE_URL="postgresql://...@dev-db...?sslmode=require"

# Production-Datenbank (NUR für explizite Production-Migrationen)
PROD_DATABASE_URL="postgresql://...@prod-db...?sslmode=require"

# Standard DATABASE_URL (sollte auf Development zeigen)
DATABASE_URL="${DEV_DATABASE_URL}"
```

### Wichtig
- **NIEMALS** `DATABASE_URL` in `.env` auf Production setzen
- Verwende `PROD_DATABASE_URL` für Production-Migrationen
- Setze `DATABASE_URL` nur temporär für Production-Migrationen

## 🚨 Was passiert bei versehentlichem Production-Zugriff?

Wenn ein Prisma-Befehl auf eine Production-Datenbank zugreift:

```
❌ FEHLER: DATABASE_URL zeigt auf Production-Datenbank!
   Production-DB-ID erkannt: fnfuklgbsojzdfnmrfad

💡 Verwende DEV_DATABASE_URL für lokale Entwicklung
💡 Oder ändere DATABASE_URL in .env auf Development-Datenbank
```

Der Befehl wird **sofort abgebrochen**.

## 📋 Production-Migrations-Checkliste

Vor jeder Production-Migration:

1. ✅ **Backup erstellen**
   ```bash
   pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. ✅ **Migration in Development testen**
   ```bash
   DATABASE_URL=$DEV_DATABASE_URL npx prisma migrate dev
   ```

3. ✅ **Production-Migration ausführen**
   ```bash
   ./scripts/migrate-production.sh
   ```

4. ✅ **Ergebnis prüfen**
   ```bash
   DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate status
   ```

## 🔧 Scripts

### `check-database-environment.sh`
Prüft, ob `DATABASE_URL` auf Production zeigt.

### `safe-prisma-wrapper.sh`
Wrapper für Prisma-Befehle mit automatischer Sicherheitsprüfung.

### `migrate-production.sh`
Sichere Production-Migration mit Bestätigung und Backup-Check.

## 💡 Best Practices

1. **Trennung**: Verwende immer `DEV_DATABASE_URL` und `PROD_DATABASE_URL`
2. **Prüfung**: Prüfe immer vor Prisma-Befehlen die Datenbank-Umgebung
3. **Backup**: Erstelle immer ein Backup vor Production-Migrationen
4. **Testen**: Teste Migrationen immer zuerst in Development
5. **Dokumentation**: Dokumentiere alle Production-Migrationen

## 🆘 Notfall

Falls versehentlich auf Production zugegriffen wurde:

1. **Sofort stoppen**: Alle laufenden Prozesse beenden
2. **Status prüfen**: Prüfe, was geändert wurde
3. **Backup prüfen**: Stelle sicher, dass ein Backup existiert
4. **Rückgängig machen**: Falls nötig, Backup wiederherstellen
5. **Dokumentieren**: Dokumentiere den Vorfall

