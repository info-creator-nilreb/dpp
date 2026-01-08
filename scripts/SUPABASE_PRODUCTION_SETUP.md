# Anleitung: Tabellen in der PRODUKTIONS-Datenbank erstellen

## Wichtig: Datenbank-Identifikation

Du hast zwei verschiedene Datenbanken:
- **DEV**: `jhxdwgnvmbnxjwiaodtj`
- **PROD**: `fnfuklgbsojzdfnmrfad`

## Schritt 1: Prüfe, welche Datenbank du verwendest

1. Öffne die **Supabase SQL Console** in deinem **PRODUKTIONS-Projekt**
2. Führe `scripts/check-database-connection.sql` aus
3. Prüfe, ob die Ausgabe zeigt: `✓ PRODUKTION (fnfuklgbsojzdfnmrfad)`

## Schritt 2: Stelle sicher, dass du im PRODUKTIONS-Projekt bist

**In Supabase Dashboard:**
- Gehe zu deinem **PRODUKTIONS-Projekt** (nicht DEV)
- Klicke auf "SQL Editor"
- Stelle sicher, dass oben im Breadcrumb "PRODUCTION" steht

## Schritt 3: Führe das Tabellen-Erstellungs-Script aus

1. Öffne `scripts/create-all-missing-tables.sql`
2. Kopiere den gesamten Inhalt
3. Füge ihn in die **PRODUKTIONS** SQL Console ein
4. Klicke auf "Run"

## Schritt 4: Verifikation in der PRODUKTIONS-Datenbank

1. Führe `scripts/list-all-tables-detailed.sql` in der **PRODUKTIONS** SQL Console aus
2. Prüfe die Ergebnisse:
   - Abschnitt 2 sollte zeigen: `total_tables: 39`
   - Abschnitt 4 sollte **keine** fehlenden Tabellen auflisten

## Alternative: Direktes SQL für PRODUKTION

Falls du sicherstellen möchtest, dass du gegen die richtige Datenbank arbeitest, kannst du dieses SQL direkt in der Supabase SQL Console ausführen:

```sql
-- Prüfe zuerst die Datenbank
SELECT 
    current_database() as datenbank,
    CASE 
        WHEN current_database() LIKE '%fnfuklgbsojzdfnmrfad%' THEN '✓ PRODUKTION'
        WHEN current_database() LIKE '%jhxdwgnvmbnxjwiaodtj%' THEN '⚠ ENTWICKLUNG'
        ELSE '? UNBEKANNT'
    END as typ;

-- Dann zähle Tabellen
SELECT COUNT(*) as anzahl_tabellen
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

## Wichtig

- **Niemals** das Script in der DEV-Datenbank ausführen, wenn du PROD meinst
- Prüfe immer zuerst, welche Datenbank du verwendest
- Die Supabase SQL Console zeigt oben an, in welchem Projekt du bist

