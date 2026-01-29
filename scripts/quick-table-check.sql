-- ============================================
-- Schnelle Prüfung: Alle Tabellen + Status
-- ============================================

-- 1. Zähle Tabellen
SELECT COUNT(*) as anzahl_tabellen FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 2. Liste ALLE Tabellen (alphabetisch sortiert)
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Prüfe die beiden kritischen Tabellen
SELECT 
    'dpp_permissions' as tabelle,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'dpp_permissions'
    ) THEN '✓ VORHANDEN' ELSE '✗ FEHLT' END as status
UNION ALL
SELECT 
    'platform_audit_logs' as tabelle,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'platform_audit_logs'
    ) THEN '✓ VORHANDEN' ELSE '✗ FEHLT' END as status;

