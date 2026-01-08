-- Verify that blockId and fieldId columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dpp_media' 
  AND column_name IN ('blockId', 'fieldId')
ORDER BY column_name;

