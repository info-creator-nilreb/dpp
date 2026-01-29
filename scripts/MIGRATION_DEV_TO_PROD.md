# Migration: DEV -> PROD

## Übersicht

Dieses Script überträgt alle fehlenden Tabellen und Felder von DEV nach PROD.

## Voraussetzungen

1. Python 3.11+ installiert
2. psycopg2-binary installiert: `pip install psycopg2-binary`

## Verwendung

### Schritt 1: Dependencies installieren

```bash
pip install -r scripts/requirements.txt
```

### Schritt 2: Migration-Script ausführen

```bash
python3 scripts/migrate-dev-to-prod.py
```

Das Script:
- Verbindet sich mit DEV und PROD
- Identifiziert fehlende Tabellen
- Identifiziert fehlende Spalten in existierenden Tabellen
- Generiert ein SQL-Script: `scripts/migrate-tables-to-prod.sql`

### Schritt 3: SQL-Script in PROD ausführen

1. Öffne dein **PROD-Projekt** in Supabase
2. Gehe zu **SQL Editor**
3. Öffne `scripts/migrate-tables-to-prod.sql`
4. Kopiere den gesamten Inhalt
5. Füge ihn in die SQL Console ein
6. Führe es aus

### Schritt 4: Verifikation

Nach der Ausführung sollte die Anzahl der Tabellen in PROD mit DEV übereinstimmen.

## Wichtig

- **Keine Daten werden überschrieben** - nur Struktur wird übertragen
- Das Script verwendet `CREATE TABLE IF NOT EXISTS` und `ADD COLUMN IF NOT EXISTS`
- Foreign Keys und Indizes werden ebenfalls übertragen

## Troubleshooting

Falls das Script Fehler wirft:
- Prüfe die Connection Strings
- Stelle sicher, dass beide Datenbanken erreichbar sind
- Prüfe, ob psycopg2-binary installiert ist

