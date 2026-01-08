-- ============================================
-- Exportiere Tabellen-Struktur aus DEV
-- Führe dies in DEV aus, um die CREATE TABLE Statements zu bekommen
-- ============================================

-- 1. Exportiere dpp_versions_media Struktur
SELECT 
    'CREATE TABLE "dpp_versions_media" (' || E'\n' ||
    string_agg(
        '    "' || column_name || '" ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'TEXT'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP(3)'
            WHEN data_type = 'boolean' THEN 'BOOLEAN'
            WHEN data_type = 'integer' THEN 'INTEGER'
            WHEN data_type = 'bigint' THEN 'BIGINT'
            WHEN data_type = 'double precision' THEN 'DOUBLE PRECISION'
            WHEN data_type = 'jsonb' THEN 'JSONB'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
            ELSE ''
        END ||
        ',',
        E'\n'
    ) || E'\n' ||
    '    CONSTRAINT "dpp_versions_media_pkey" PRIMARY KEY ("id")' || E'\n' ||
    ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'dpp_versions_media'
ORDER BY ordinal_position;

-- 2. Exportiere organization_billing Struktur
SELECT 
    'CREATE TABLE "organization_billing" (' || E'\n' ||
    string_agg(
        '    "' || column_name || '" ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'TEXT'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP(3)'
            WHEN data_type = 'boolean' THEN 'BOOLEAN'
            WHEN data_type = 'integer' THEN 'INTEGER'
            WHEN data_type = 'bigint' THEN 'BIGINT'
            WHEN data_type = 'double precision' THEN 'DOUBLE PRECISION'
            WHEN data_type = 'jsonb' THEN 'JSONB'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
            ELSE ''
        END ||
        ',',
        E'\n'
    ) || E'\n' ||
    '    CONSTRAINT "organization_billing_pkey" PRIMARY KEY ("id")' || E'\n' ||
    ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organization_billing'
ORDER BY ordinal_position;

-- 3. Zeige auch Indizes und Foreign Keys für dpp_versions_media
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'dpp_versions_media';

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.dpp_versions_media'::regclass;

-- 4. Zeige auch Indizes und Foreign Keys für organization_billing
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'organization_billing';

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.organization_billing'::regclass;

