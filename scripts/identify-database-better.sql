-- ============================================
-- Bessere Datenbank-Identifikation
-- ============================================

-- 1. Zeige Connection-Info (falls verfügbar)
SELECT 
    current_database() as datenbank_name,
    current_user as benutzer,
    inet_server_addr() as server_ip;

-- 2. Prüfe über vorhandene Tabellen (PROD sollte mehr haben)
SELECT 
    COUNT(*) as anzahl_tabellen,
    CASE 
        WHEN COUNT(*) >= 38 THEN 'Vermutlich PRODUKTION (39 erwartet)'
        WHEN COUNT(*) = 37 THEN 'Vermutlich PRODUKTION (fehlen 2 Tabellen)'
        WHEN COUNT(*) < 30 THEN 'Vermutlich ENTWICKLUNG'
        ELSE 'Unbekannt'
    END as vermutung
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 3. Prüfe spezifische Tabellen, die nur in PROD sein sollten
SELECT 
    'dpp_permissions' as tabelle,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_permissions'
        ) THEN '✓ VORHANDEN'
        ELSE '✗ FEHLT'
    END as status
UNION ALL
SELECT 
    'platform_audit_logs' as tabelle,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'platform_audit_logs'
        ) THEN '✓ VORHANDEN'
        ELSE '✗ FEHLT'
    END as status;

