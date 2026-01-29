-- ============================================
-- Prüfe, welche Datenbank aktuell verwendet wird
-- ============================================

-- 1. Zeige die aktuelle Datenbank-Verbindung
SELECT 
    current_database() as aktuelle_datenbank,
    current_user as aktueller_benutzer,
    inet_server_addr() as server_ip,
    version() as postgres_version;

-- 2. Prüfe die Datenbank-URL (aus Umgebungsvariablen, falls verfügbar)
-- Hinweis: Dies funktioniert nur, wenn die Umgebungsvariable gesetzt ist
SELECT 
    CASE 
        WHEN current_database() LIKE '%fnfuklgbsojzdfnmrfad%' THEN '✓ PRODUKTION (fnfuklgbsojzdfnmrfad)'
        WHEN current_database() LIKE '%jhxdwgnvmbnxjwiaodtj%' THEN '⚠ ENTWICKLUNG (jhxdwgnvmbnxjwiaodtj)'
        ELSE '? UNBEKANNT: ' || current_database()
    END as datenbank_typ;

-- 3. Zähle Tabellen in der aktuellen Datenbank
SELECT 
    COUNT(*) as anzahl_tabellen,
    'In Datenbank: ' || current_database() as datenbank_name
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 4. Liste alle Tabellen (zur Verifikation)
SELECT 
    table_name,
    'In DB: ' || current_database() as datenbank_info
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

