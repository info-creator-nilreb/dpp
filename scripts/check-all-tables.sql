-- Zähle alle Tabellen in der Datenbank
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
