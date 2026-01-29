-- Verifiziere, dass blockId und fieldId jetzt existieren
SELECT 
    'blockId' as column_name,
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
    'fieldId' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_media' 
            AND column_name = 'fieldId'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;
