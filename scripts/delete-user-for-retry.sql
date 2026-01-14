-- Script zum Löschen eines Users für erneute Registrierung
-- 
-- WICHTIG: Ersetze 'USER_EMAIL_HIER' mit der tatsächlichen E-Mail-Adresse
-- 
-- Option 1: Nur User löschen (Organisation bleibt bestehen)
-- Option 2: User + Organisation löschen (alles sauber)

-- ============================================
-- OPTION 1: Nur User löschen
-- ============================================
-- Die folgenden Tabellen werden automatisch gelöscht (CASCADE):
-- - memberships
-- - dpp_permissions  
-- - notifications
-- - join_requests
--
-- Diese werden auf NULL gesetzt (SET NULL):
-- - platform_audit_logs.actorId
-- - invitations.invitedById
-- - dpp_versions.createdByUserId

-- BEGIN;

-- DELETE FROM users WHERE email = 'USER_EMAIL_HIER';

-- COMMIT;

-- ============================================
-- OPTION 2: User + Organisation löschen (empfohlen für Test-Registrierungen)
-- ============================================
-- Wenn der User eine Organisation erstellt hat, wird diese auch gelöscht.
-- Dadurch werden automatisch gelöscht:
-- - Alle DPPs der Organisation
-- - Alle Memberships
-- - Alle Invitations
-- - Alle Join Requests
-- - Subscription (falls vorhanden)

BEGIN;

-- 1. Finde User-ID und Organisation-ID
DO $$
DECLARE
    v_user_id TEXT;
    v_org_id TEXT;
BEGIN
    -- Hole User-ID
    SELECT id INTO v_user_id FROM users WHERE email = 'USER_EMAIL_HIER';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User mit E-Mail nicht gefunden';
    END IF;
    
    -- Hole Organisation-ID aus der ersten Membership
    SELECT organization_id INTO v_org_id 
    FROM memberships 
    WHERE user_id = v_user_id 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- 2. Lösche Organisation (wenn vorhanden) - löscht automatisch:
    --    - Alle DPPs (und deren Media, Content, Permissions, Versions, etc.)
    --    - Alle Memberships
    --    - Alle Invitations
    --    - Alle Join Requests
    --    - Subscription
    IF v_org_id IS NOT NULL THEN
        DELETE FROM organizations WHERE id = v_org_id;
        RAISE NOTICE 'Organisation % gelöscht', v_org_id;
    END IF;
    
    -- 3. Lösche User (löscht automatisch):
    --    - Memberships (falls noch vorhanden)
    --    - DppPermissions
    --    - Notifications
    --    - JoinRequests
    DELETE FROM users WHERE id = v_user_id;
    RAISE NOTICE 'User % gelöscht', v_user_id;
    
END $$;

COMMIT;

-- ============================================
-- VERIFIZIERUNG
-- ============================================
-- Prüfe ob User gelöscht wurde:
-- SELECT * FROM users WHERE email = 'USER_EMAIL_HIER';
--
-- Prüfe ob Organisation gelöscht wurde (falls vorhanden):
-- SELECT * FROM organizations WHERE id = 'ORGANISATION_ID_HIER';


