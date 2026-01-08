-- Prüfe, ob die Migration 20250105000000_add_block_field_to_media als ausgeführt markiert ist
SELECT 
    migration_name,
    applied_steps_count
FROM "_prisma_migrations"
WHERE migration_name = '20250105000000_add_block_field_to_media';
