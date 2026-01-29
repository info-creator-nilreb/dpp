-- ============================================
-- Detaillierte Auflistung aller Tabellen in der Datenbank
-- ============================================

-- 1. Liste ALLE Tabellen mit Anzahl der Spalten
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Zähle die Gesamtanzahl
SELECT 
    COUNT(*) as total_tables,
    'Aktuell in Datenbank' as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 3. Prüfe spezifisch die erwarteten Tabellen
SELECT 
    expected_table as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = expected_table
        ) THEN '✓ VORHANDEN'
        ELSE '✗ FEHLT'
    END as status
FROM (
    VALUES 
        ('users'),
        ('organizations'),
        ('memberships'),
        ('dpps'),
        ('dpp_media'),
        ('dpp_versions'),
        ('dpp_permissions'),
        ('contributor_tokens'),
        ('super_admins'),
        ('super_admin_2fa'),
        ('super_admin_sessions'),
        ('audit_logs'),
        ('platform_audit_logs'),
        ('subscriptions'),
        ('features'),
        ('organization_features'),
        ('templates'),
        ('template_blocks'),
        ('template_fields'),
        ('feature_registry'),
        ('block_types'),
        ('dpp_content'),
        ('pricing_plans'),
        ('pricing_plan_features'),
        ('entitlements'),
        ('pricing_plan_entitlements'),
        ('subscription_models'),
        ('prices'),
        ('price_snapshots'),
        ('entitlement_snapshots'),
        ('trial_feature_overrides'),
        ('trial_entitlement_overrides'),
        ('invitations'),
        ('join_requests'),
        ('notifications'),
        ('password_protection_config')
) AS expected_tables(expected_table)
ORDER BY expected_table;

-- 4. Zeige nur die FEHLENDEN Tabellen
SELECT 
    expected_table as fehlende_tabelle
FROM (
    VALUES 
        ('users'),
        ('organizations'),
        ('memberships'),
        ('dpps'),
        ('dpp_media'),
        ('dpp_versions'),
        ('dpp_permissions'),
        ('contributor_tokens'),
        ('super_admins'),
        ('super_admin_2fa'),
        ('super_admin_sessions'),
        ('audit_logs'),
        ('platform_audit_logs'),
        ('subscriptions'),
        ('features'),
        ('organization_features'),
        ('templates'),
        ('template_blocks'),
        ('template_fields'),
        ('feature_registry'),
        ('block_types'),
        ('dpp_content'),
        ('pricing_plans'),
        ('pricing_plan_features'),
        ('entitlements'),
        ('pricing_plan_entitlements'),
        ('subscription_models'),
        ('prices'),
        ('price_snapshots'),
        ('entitlement_snapshots'),
        ('trial_feature_overrides'),
        ('trial_entitlement_overrides'),
        ('invitations'),
        ('join_requests'),
        ('notifications'),
        ('password_protection_config')
) AS expected_tables(expected_table)
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = expected_table
)
ORDER BY expected_table;

