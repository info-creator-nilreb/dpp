-- ============================================
-- Update Password Protection Hash in PROD
-- ============================================
-- Hash aus DEV: $2a$10$QgXn9IX61h6suHvQYnxlIOomzodt1X2ulcVRQ3Wre.Z1sT/dqKzEy
-- WICHTIG: Spalten heißen updatedAt und updatedBy (CamelCase)
-- ============================================

-- Update den neuesten Eintrag
UPDATE password_protection_config
SET 
  password_protection_password_hash = '$2a$10$QgXn9IX61h6suHvQYnxlIOomzodt1X2ulcVRQ3Wre.Z1sT/dqKzEy',
  updatedBy = 'migration-script',
  updatedAt = NOW()
WHERE id IN (
  SELECT id 
  FROM password_protection_config 
  ORDER BY updatedAt DESC 
  LIMIT 1
);

-- Verifikation
SELECT 
  id,
  password_protection_enabled,
  password_protection_password_hash IS NOT NULL as hash_vorhanden,
  LENGTH(password_protection_password_hash) as hash_laenge,
  SUBSTRING(password_protection_password_hash, 1, 30) as hash_prefix,
  updatedAt,
  updatedBy
FROM password_protection_config
ORDER BY updatedAt DESC
LIMIT 1;

