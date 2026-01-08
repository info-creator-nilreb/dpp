-- Prüfe, welche Tabellen im Schema definiert sind vs. was in der DB existiert
SELECT 
    'Missing in DB' as status,
    table_name
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
) AS expected_tables(table_name)
WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = expected_tables.table_name
)
ORDER BY table_name;
