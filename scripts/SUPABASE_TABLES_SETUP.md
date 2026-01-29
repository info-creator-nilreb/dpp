# Anleitung: Fehlende Tabellen in Supabase erstellen

## Problem
In der Produktionsdatenbank fehlen Tabellen (nur 37 statt 39 Tabellen).

## Lösung
Führe das SQL-Script `create-all-missing-tables.sql` direkt in der Supabase SQL Console aus.

## Schritt-für-Schritt Anleitung

### 1. Öffne Supabase Dashboard
- Gehe zu deinem Supabase-Projekt
- Klicke auf "SQL Editor" im linken Menü

### 2. Öffne das SQL-Script
- Öffne die Datei `scripts/create-all-missing-tables.sql` in deinem Editor
- Kopiere den gesamten Inhalt

### 3. Führe das Script aus
- Füge den kopierten SQL-Code in die Supabase SQL Console ein
- Klicke auf "Run" oder drücke `Ctrl+Enter` (Windows/Linux) oder `Cmd+Enter` (Mac)

### 4. Verifikation
Nach der Ausführung kannst du prüfen, ob alle Tabellen erstellt wurden:

```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

Erwartetes Ergebnis: **39 Tabellen**

### 5. Prüfe spezifische Tabellen
Um zu sehen, welche Tabellen jetzt vorhanden sind:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## Was wird erstellt?

Das Script erstellt folgende Tabellen (falls sie noch nicht existieren):

1. **dpp_permissions** - Berechtigungen für DPPs
2. **platform_audit_logs** - Platform-weite Audit-Logs
3. **feature_registry** - Feature-Registry (falls fehlend)
4. **block_types** - Block-Typen (falls fehlend)
5. **dpp_content** - DPP-Inhalte (falls fehlend)

Zusätzlich werden die Spalten `blockId` und `fieldId` zu `dpp_media` hinzugefügt (falls noch nicht vorhanden).

## Wichtig

- Das Script ist **idempotent** - es kann mehrfach sicher ausgeführt werden
- Es verwendet `CREATE TABLE IF NOT EXISTS` und `IF NOT EXISTS` Checks
- Bestehende Daten werden **nicht** überschrieben
- Foreign Keys werden nur hinzugefügt, wenn sie noch nicht existieren

## Nach der Ausführung

Nach erfolgreicher Ausführung:
1. Warte auf das nächste Vercel Deployment (oder triggere manuell)
2. Der Prisma Client wird automatisch neu generiert
3. Die DPP-Anzeige sollte wieder funktionieren

## Fehlerbehebung

Falls Fehler auftreten:
- Prüfe, ob alle abhängigen Tabellen existieren (z.B. `users`, `organizations`, `dpps`)
- Prüfe die Supabase Logs für detaillierte Fehlermeldungen
- Stelle sicher, dass du die richtige Datenbank ausgewählt hast

