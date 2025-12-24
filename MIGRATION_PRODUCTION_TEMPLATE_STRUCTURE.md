# Production Migration: Template-Struktur und Schema-Änderungen

## Übersicht

Diese Migration führt alle Schema-Änderungen für die Template-Struktur und Super Admin Erweiterungen in die Produktionsdatenbank ein.

**Wichtig:**
- ✅ Nur Tabellen- und Feldstrukturen werden übertragen
- ✅ Keine Daten werden migriert oder verändert
- ✅ Alle Migrationen verwenden `IF NOT EXISTS` / `IF EXISTS` Checks
- ✅ Migrationen sind idempotent (können mehrfach ausgeführt werden)

## Migrationsreihenfolge

Die folgenden Migrationen müssen in dieser Reihenfolge ausgeführt werden:

1. `20251216194622_init` - Initiale Schema-Struktur (falls noch nicht vorhanden)
2. `20251222131000_create_template_tables` - Template-Tabellen erstellen
3. `20251222131801_add_super_admin_extensions` - Super Admin Erweiterungen
4. `20251222140000_add_super_admin_tables` - Super Admin Tabellen
5. `20251222170000_add_template_versioning_fields` - Template-Versionierung
6. `20251223011622_add_regulatory_mapping` - Regulatory Mapping Feld
7. `20251223211400_add_category_label` - Category Label Feld

## Migration ausführen

### Option 1: Prisma Migrate Deploy (Empfohlen)

**Wichtig:** Verwenden Sie **einfache Anführungszeichen** (`'`) um die DATABASE_URL, damit zsh das `!` nicht als History-Expansion interpretiert:

```bash
DATABASE_URL='postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:5432/postgres' npx prisma migrate deploy
```

Dieser Befehl führt automatisch alle ausstehenden Migrationen aus, die noch nicht in der Production-Datenbank angewendet wurden.

### Option 2: Migration Status prüfen

Zuerst den Status prüfen:

```bash
DATABASE_URL='postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:5432/postgres' npx prisma migrate status
```

Dies zeigt, welche Migrationen bereits angewendet wurden und welche noch ausstehen.

## Nach der Migration

Nach erfolgreicher Migration:

1. **Prisma Client regenerieren** (wird normalerweise beim Build automatisch gemacht):
   ```bash
   npx prisma generate
   ```

2. **Tabellenstruktur verifizieren:**
   - Anzahl der Tabellen sollte zwischen Dev und Production identisch sein
   - Anzahl der Felder pro Tabelle sollte identisch sein
   - Keine Daten wurden übertragen (nur Schema)

3. **Server neu starten** (falls nötig)

## Verifikation

Nach der Migration können Sie die Tabellenstruktur wie folgt prüfen:

```sql
-- Anzahl der Tabellen prüfen
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Template-Tabellen prüfen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('templates', 'template_blocks', 'template_fields')
ORDER BY table_name;

-- Felder der templates Tabelle prüfen
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'templates'
ORDER BY ordinal_position;
```

## Wichtige Hinweise

- Die Migrationen sind **idempotent** - sie können mehrfach ausgeführt werden ohne Probleme
- Alle `ALTER TABLE` Statements verwenden `IF NOT EXISTS` oder `IF EXISTS` Checks
- Bestehende Daten werden nicht gelöscht oder verändert (außer NULL-Kategorien werden auf 'OTHER' gesetzt, falls nötig)
- Falls eine Migration bereits angewendet wurde, wird sie übersprungen

