-- Prüfe, ob blockId und fieldId existieren
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_media' 
            AND column_name = 'blockId'
        ) THEN 'blockId: EXISTS'
        ELSE 'blockId: MISSING'
    END as blockId_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_media' 
            AND column_name = 'fieldId'
        ) THEN 'fieldId: EXISTS'
        ELSE 'fieldId: MISSING'
    END as fieldId_status;
