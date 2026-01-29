-- ============================================
-- Diagnose: Warum werden nur 37 Tabellen gezählt?
-- ============================================

-- 1. Zähle ALLE Tabellen (inkl. System-Tabellen)
SELECT 
    'Alle Tabellen (inkl. System)' as typ,
    COUNT(*) as anzahl
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 2. Liste ALLE Tabellen mit Schema
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Prüfe spezifisch die beiden Tabellen
SELECT 
    'dpp_permissions' as tabelle,
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'dpp_permissions'
UNION ALL
SELECT 
    'platform_audit_logs' as tabelle,
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'platform_audit_logs';

-- 4. Prüfe, ob die Tabellen vielleicht in einem anderen Schema sind
SELECT 
    table_schema,
    COUNT(*) as anzahl_tabellen
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- 5. Suche nach den Tabellen in ALLEN Schemas
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name IN ('dpp_permissions', 'platform_audit_logs')
AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- 6. Zähle nochmal mit expliziter Schema-Prüfung
SELECT 
    COUNT(*) as anzahl_tabellen_public_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE '_prisma%'  -- Exkludiere Prisma interne Tabellen
AND table_name NOT LIKE 'pg_%';     -- Exkludiere PostgreSQL System-Tabellen

