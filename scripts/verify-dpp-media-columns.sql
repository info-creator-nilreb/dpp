-- Prüfe, ob blockId und fieldId in dpp_media existieren
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'dpp_media'
AND column_name IN ('blockId', 'fieldId')
ORDER BY column_name;
