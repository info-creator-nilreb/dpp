-- ============================================
-- Kopiere Password Protection Hash von DEV nach PROD
-- ============================================
-- WICHTIG: Dieses Script muss manuell ausgeführt werden
-- 1. Hole den Hash aus DEV (siehe unten)
-- 2. Führe das UPDATE in PROD aus
-- ============================================

-- SCHRITT 1: In DEV ausführen, um den Hash zu bekommen:
-- SELECT password_protection_password_hash 
-- FROM password_protection_config 
-- ORDER BY updated_at DESC 
-- LIMIT 1;

-- SCHRITT 2: Kopiere den Hash-Wert und füge ihn unten ein, dann in PROD ausführen:

-- UPDATE password_protection_config
-- SET 
--   password_protection_password_hash = '$2a$10$QgXn9IX61h6suHvQYnxlIOo...', -- HIER DEN HASH AUS DEV EINFÜGEN
--   updated_by = 'migration-script',
--   updated_at = NOW()
-- WHERE id = (SELECT id FROM password_protection_config ORDER BY updated_at DESC LIMIT 1);

-- ODER: Automatisch den neuesten Eintrag aktualisieren
-- UPDATE password_protection_config
-- SET 
--   password_protection_password_hash = '$2a$10$QgXn9IX61h6suHvQYnxlIOo...', -- HIER DEN HASH AUS DEV EINFÜGEN
--   updated_by = 'migration-script',
--   updated_at = NOW()
-- WHERE id IN (SELECT id FROM password_protection_config ORDER BY updated_at DESC LIMIT 1);

-- Verifikation nach dem Update:
-- SELECT 
--   id,
--   password_protection_enabled,
--   password_protection_password_hash IS NOT NULL as hash_vorhanden,
--   LENGTH(password_protection_password_hash) as hash_laenge,
--   SUBSTRING(password_protection_password_hash, 1, 20) as hash_prefix,
--   updated_at,
--   updated_by
-- FROM password_protection_config
-- ORDER BY updated_at DESC
-- LIMIT 1;

