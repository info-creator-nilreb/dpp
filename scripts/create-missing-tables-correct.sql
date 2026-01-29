-- ============================================
-- Erstelle die FEHLENDEN Tabellen: dpp_versions_media und organization_billing
-- ============================================
-- WICHTIG: Dieses Script basiert auf Annahmen.
-- Bitte führe zuerst scripts/export-table-structure-from-dev.sql in DEV aus,
-- um die korrekte Struktur zu bekommen, und passe dieses Script dann an.
-- ============================================

-- Tabelle 1: dpp_versions_media
-- ANNAHME: Ähnlich wie dpp_media, aber mit versionId statt dppId
CREATE TABLE IF NOT EXISTS "dpp_versions_media" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockId" TEXT,
    "fieldId" TEXT,

    CONSTRAINT "dpp_versions_media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dpp_versions_media_versionId_idx" ON "dpp_versions_media"("versionId");
CREATE INDEX IF NOT EXISTS "dpp_versions_media_versionId_blockId_fieldId_idx" ON "dpp_versions_media"("versionId", "blockId", "fieldId");

-- Foreign Keys für dpp_versions_media
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dpp_versions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'dpp_versions_media_versionId_fkey'
    ) THEN
      ALTER TABLE "dpp_versions_media" 
      ADD CONSTRAINT "dpp_versions_media_versionId_fkey" 
      FOREIGN KEY ("versionId") REFERENCES "dpp_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- Tabelle 2: organization_billing
-- ANNAHME: Separate Tabelle für Billing-Informationen
CREATE TABLE IF NOT EXISTS "organization_billing" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "billingEmail" TEXT,
    "billingContactUserId" TEXT,
    "invoiceAddressStreet" TEXT,
    "invoiceAddressZip" TEXT,
    "invoiceAddressCity" TEXT,
    "invoiceAddressCountry" TEXT,
    "billingCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_billing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_billing_organizationId_key" ON "organization_billing"("organizationId");

-- Foreign Keys für organization_billing
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'organization_billing_organizationId_fkey'
    ) THEN
      ALTER TABLE "organization_billing" 
      ADD CONSTRAINT "organization_billing_organizationId_fkey" 
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'organization_billing_billingContactUserId_fkey'
    ) THEN
      ALTER TABLE "organization_billing" 
      ADD CONSTRAINT "organization_billing_billingContactUserId_fkey" 
      FOREIGN KEY ("billingContactUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- Verifikation
SELECT 
    COUNT(*) as anzahl_tabellen,
    CASE 
        WHEN COUNT(*) = 39 THEN '✓ ALLE TABELLEN VORHANDEN (39/39)'
        ELSE 'Aktuell: ' || COUNT(*)::TEXT || ' Tabellen'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Prüfe die beiden Tabellen
SELECT 
    'dpp_versions_media' as tabelle,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_versions_media'
        ) THEN '✓ VORHANDEN'
        ELSE '✗ FEHLT'
    END as status
UNION ALL
SELECT 
    'organization_billing' as tabelle,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'organization_billing'
        ) THEN '✓ VORHANDEN'
        ELSE '✗ FEHLT'
    END as status;

