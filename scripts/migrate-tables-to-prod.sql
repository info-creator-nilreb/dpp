-- ============================================
-- Migration: DEV -> PROD
-- Fehlende Tabellen: 2
-- ============================================

CREATE TABLE IF NOT EXISTS "dpp_version_media" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "role" TEXT,
    "blockId" TEXT,
    "fieldKey" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dpp_version_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "dpp_version_media_pkey" ON "dpp_version_media"("id");

CREATE INDEX IF NOT EXISTS "dpp_version_media_versionId_idx" ON "dpp_version_media"("versionId");

CREATE INDEX IF NOT EXISTS "dpp_version_media_versionId_role_idx" ON "dpp_version_media"("versionId", "role");

CREATE INDEX IF NOT EXISTS "dpp_version_media_blockId_idx" ON "dpp_version_media"("blockId");

-- Foreign Key für dpp_version_media
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dpp_version_media_versionId_fkey'
  ) THEN
    ALTER TABLE "dpp_version_media" 
    ADD CONSTRAINT "dpp_version_media_versionId_fkey" 
    FOREIGN KEY ("versionId") REFERENCES "dpp_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_billing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_billing_pkey" ON "organization_billing"("id");

CREATE UNIQUE INDEX IF NOT EXISTS "organization_billing_organizationId_key" ON "organization_billing"("organizationId");

-- Foreign Key für organization_billing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organization_billing_organizationId_fkey'
  ) THEN
    ALTER TABLE "organization_billing" 
    ADD CONSTRAINT "organization_billing_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organization_billing_billingContactUserId_fkey'
  ) THEN
    ALTER TABLE "organization_billing" 
    ADD CONSTRAINT "organization_billing_billingContactUserId_fkey" 
    FOREIGN KEY ("billingContactUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Verifikation
SELECT COUNT(*) as anzahl_tabellen FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';


-- ============================================
-- Fehlende Spalten in existierenden Tabellen
-- ============================================

ALTER TABLE "dpp_media" ADD COLUMN IF NOT EXISTS "role" TEXT;
ALTER TABLE "dpp_media" ADD COLUMN IF NOT EXISTS "fieldKey" TEXT;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "invitedByUserId" TEXT;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
-- requestedAt: Zuerst als nullable hinzufügen, dann Default setzen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'join_requests' 
    AND column_name = 'requestedAt'
  ) THEN
    ALTER TABLE "join_requests" ADD COLUMN "requestedAt" TIMESTAMP(3);
    -- Setze Default für neue Zeilen
    ALTER TABLE "join_requests" ALTER COLUMN "requestedAt" SET DEFAULT CURRENT_TIMESTAMP;
    -- Setze Wert für bestehende Zeilen (falls vorhanden)
    UPDATE "join_requests" SET "requestedAt" = "createdAt" WHERE "requestedAt" IS NULL;
    -- Mache NOT NULL (nur wenn keine NULL-Werte mehr vorhanden)
    ALTER TABLE "join_requests" ALTER COLUMN "requestedAt" SET NOT NULL;
  END IF;
END $$;
ALTER TABLE "join_requests" ADD COLUMN IF NOT EXISTS "reviewedByUserId" TEXT;
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3);