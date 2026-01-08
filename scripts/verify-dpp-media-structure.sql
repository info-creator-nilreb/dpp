-- Verifiziere die Struktur von dpp_media
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'dpp_media'
ORDER BY ordinal_position;
