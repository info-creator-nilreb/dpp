# Anleitung: Tabellen von DEV nach PROD exportieren/importieren

## Option 1: SQL Export/Import in Supabase

### Schritt 1: Tabellen-Struktur aus DEV exportieren

1. Öffne dein **DEV-Projekt** in Supabase
2. Gehe zu **SQL Editor**
3. Führe dieses SQL aus, um die CREATE TABLE Statements zu generieren:

```sql
-- Exportiere dpp_permissions
SELECT 
    'CREATE TABLE "dpp_permissions" (' || E'\n' ||
    string_agg(
        '    "' || column_name || '" ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'TEXT'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP(3)'
            WHEN data_type = 'boolean' THEN 'BOOLEAN'
            WHEN data_type = 'double precision' THEN 'DOUBLE PRECISION'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
            ELSE ''
        END ||
        ',',
        E'\n'
    ) || E'\n' ||
    '    CONSTRAINT "dpp_permissions_pkey" PRIMARY KEY ("id")' || E'\n' ||
    ');'
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'dpp_permissions'
ORDER BY ordinal_position;
```

### Schritt 2: In PROD importieren

1. Öffne dein **PROD-Projekt** in Supabase
2. Gehe zu **SQL Editor**
3. Füge die exportierten CREATE TABLE Statements ein
4. Führe sie aus

## Option 2: Direktes SQL-Script (EINFACHER)

**Verwende einfach das Script `scripts/create-tables-direct.sql`:**

1. Öffne dein **PROD-Projekt** in Supabase
2. Gehe zu **SQL Editor**
3. Öffne `scripts/create-tables-direct.sql`
4. Kopiere den gesamten Inhalt
5. Füge ihn in die SQL Console ein
6. Führe es aus

**WICHTIG:** Falls die Tabellen bereits existieren, zeigt das Script einen Fehler. Das ist normal - dann existieren sie bereits.

## Option 3: Supabase Dashboard (GUI)

### Tabellen-Struktur kopieren:

1. **DEV-Projekt:**
   - Gehe zu **Table Editor**
   - Klicke auf die Tabelle `dpp_permissions`
   - Klicke auf **"..."** (drei Punkte) → **"View Table Definition"**
   - Kopiere die SQL-Definition

2. **PROD-Projekt:**
   - Gehe zu **SQL Editor**
   - Füge die kopierte Definition ein
   - Führe sie aus

## Empfehlung

**Verwende Option 2** (`scripts/create-tables-direct.sql`) - das ist der einfachste Weg!

