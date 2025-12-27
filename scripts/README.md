# Datenbank-Migrations-Scripts

Dieses Verzeichnis enthält Scripts für Datenbank-Migrationen.

## Fehlende Tabellen zur Produktionsdatenbank hinzufügen

### Problem
Die folgenden Tabellen fehlen in der Produktionsdatenbank:
- `feature_registry`
- `block_types`
- `dpp_content`

### Lösung

#### Option 1: Mit npm Script (empfohlen)

```bash
# Setze die DATABASE_URL für die Produktionsdatenbank
export DATABASE_URL="postgresql://user:password@host:port/database"

# Führe die Migration aus
npm run migrate:production:missing-tables
```

#### Option 2: Direkt mit Shell Script

```bash
# Setze die DATABASE_URL für die Produktionsdatenbank
export DATABASE_URL="postgresql://user:password@host:port/database"

# Führe das Script aus
./scripts/apply-missing-tables-to-production.sh
```

#### Option 3: Direkt mit psql

```bash
# Setze die DATABASE_URL für die Produktionsdatenbank
export DATABASE_URL="postgresql://user:password@host:port/database"

# Führe das SQL-Script aus
psql "$DATABASE_URL" -f scripts/apply-missing-tables-to-production.sql
```

### Was macht das Script?

1. **Erstellt die drei fehlenden Tabellen** (falls sie nicht bereits existieren):
   - `feature_registry` - Feature-Registry für DPP-Features
   - `block_types` - Block-Typen für Content-Blocks
   - `dpp_content` - DPP-Content mit Blocks und Styling

2. **Erstellt alle notwendigen Indizes** für optimale Performance

3. **Erstellt Foreign Key Constraints** für Datenintegrität

4. **Keine Datenmigration**: Das Script erstellt nur die Tabellenstruktur, keine Datensätze werden migriert

### Sicherheit

- Das Script verwendet `CREATE TABLE IF NOT EXISTS`, sodass es sicher mehrfach ausgeführt werden kann
- Bestehende Daten werden nicht gelöscht oder verändert
- Foreign Keys werden nur erstellt, wenn sie nicht bereits existieren

### Verifikation

Nach der Migration kannst du die Tabellenstruktur prüfen:

```bash
psql "$DATABASE_URL" -c "\d feature_registry"
psql "$DATABASE_URL" -c "\d block_types"
psql "$DATABASE_URL" -c "\d dpp_content"
```

### Wichtige Hinweise

- **Backup**: Erstelle vor der Migration ein Backup der Produktionsdatenbank
- **DATABASE_URL**: Stelle sicher, dass die `DATABASE_URL` auf die **Produktionsdatenbank** zeigt, nicht auf die Dev-Datenbank
- **Test**: Teste die Migration zuerst auf einer Test-Datenbank mit der gleichen Struktur

