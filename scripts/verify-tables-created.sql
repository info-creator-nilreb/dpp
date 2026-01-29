-- ============================================
-- Verifikations-Script: Prüfe, ob alle Tabellen erstellt wurden
-- ============================================

-- 1. Zähle alle Tabellen
SELECT 
    COUNT(*) as total_tables,
    'Erwartet: 39 Tabellen' as note
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 2. Prüfe spezifisch die neu erstellten Tabellen
SELECT 
    'dpp_permissions' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_permissions'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
UNION ALL
SELECT 
    'platform_audit_logs' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'platform_audit_logs'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
UNION ALL
SELECT 
    'feature_registry' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'feature_registry'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
UNION ALL
SELECT 
    'block_types' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'block_types'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
UNION ALL
SELECT 
    'dpp_content' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_content'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- 3. Prüfe blockId und fieldId in dpp_media
SELECT 
    'dpp_media.blockId' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_media' 
            AND column_name = 'blockId'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
UNION ALL
SELECT 
    'dpp_media.fieldId' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_media' 
            AND column_name = 'fieldId'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- 4. Liste alle Tabellen (optional, zum Überprüfen)
-- Entferne die Kommentare, um alle Tabellennamen zu sehen:
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public' 
-- AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

