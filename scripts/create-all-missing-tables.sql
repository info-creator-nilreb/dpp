-- ============================================
-- Vollständiges SQL-Script zum Erstellen aller fehlenden Tabellen in Supabase
-- Dieses Script kann direkt in der Supabase SQL Console ausgeführt werden
-- ============================================

-- ============================================
-- 1. DPP Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS "dpp_permissions" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sections" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpp_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "dpp_permissions_dppId_userId_role_key" ON "dpp_permissions"("dppId", "userId", "role");

-- Add Foreign Keys
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dpp_permissions_dppId_fkey'
  ) THEN
    ALTER TABLE "dpp_permissions" 
    ADD CONSTRAINT "dpp_permissions_dppId_fkey" 
    FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dpp_permissions_userId_fkey'
  ) THEN
    ALTER TABLE "dpp_permissions" 
    ADD CONSTRAINT "dpp_permissions_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 2. Platform Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorRole" TEXT,
    "organizationId" TEXT,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "source" TEXT NOT NULL,
    "complianceRelevant" BOOLEAN NOT NULL DEFAULT false,
    "versionId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "aiModel" TEXT,
    "aiModelVersion" TEXT,
    "aiPromptId" TEXT,
    "aiInputSources" TEXT,
    "aiConfidenceScore" DOUBLE PRECISION,
    "aiExplainabilityNote" TEXT,
    "humanInTheLoop" BOOLEAN,
    "finalDecisionBy" TEXT,
    "regulatoryImpact" TEXT,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_audit_logs_timestamp_idx" ON "platform_audit_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_actorId_idx" ON "platform_audit_logs"("actorId");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_organizationId_idx" ON "platform_audit_logs"("organizationId");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_actionType_idx" ON "platform_audit_logs"("actionType");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_entityType_entityId_idx" ON "platform_audit_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_source_idx" ON "platform_audit_logs"("source");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_complianceRelevant_idx" ON "platform_audit_logs"("complianceRelevant");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_organizationId_timestamp_idx" ON "platform_audit_logs"("organizationId", "timestamp");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_entityType_entityId_timestamp_idx" ON "platform_audit_logs"("entityType", "entityId", "timestamp");

-- Add Foreign Keys
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'platform_audit_logs_actorId_fkey'
  ) THEN
    ALTER TABLE "platform_audit_logs" 
    ADD CONSTRAINT "platform_audit_logs_actorId_fkey" 
    FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'platform_audit_logs_organizationId_fkey'
  ) THEN
    ALTER TABLE "platform_audit_logs" 
    ADD CONSTRAINT "platform_audit_logs_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 3. Add blockId and fieldId to dpp_media (falls noch nicht vorhanden)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dpp_media' 
    AND column_name = 'blockId'
  ) THEN
    ALTER TABLE "dpp_media" ADD COLUMN "blockId" TEXT;
    RAISE NOTICE 'Spalte blockId wurde zu dpp_media hinzugefügt';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dpp_media' 
    AND column_name = 'fieldId'
  ) THEN
    ALTER TABLE "dpp_media" ADD COLUMN "fieldId" TEXT;
    RAISE NOTICE 'Spalte fieldId wurde zu dpp_media hinzugefügt';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'dpp_media' 
    AND indexname = 'dpp_media_dppId_blockId_fieldId_idx'
  ) THEN
    CREATE INDEX "dpp_media_dppId_blockId_fieldId_idx" ON "dpp_media"("dppId", "blockId", "fieldId");
    RAISE NOTICE 'Index dpp_media_dppId_blockId_fieldId_idx wurde erstellt';
  END IF;
END $$;

-- ============================================
-- 4. Alle anderen Tabellen (werden durch Migrationen erstellt, aber hier als Backup)
-- ============================================

-- Feature Registry (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS "feature_registry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "capabilityKey" TEXT,
    "minimumPlan" TEXT NOT NULL,
    "requiresActiveSubscription" BOOLEAN NOT NULL DEFAULT true,
    "requiresPublishingCapability" BOOLEAN NOT NULL DEFAULT false,
    "visibleInTrial" BOOLEAN NOT NULL DEFAULT true,
    "usableInTrial" BOOLEAN NOT NULL DEFAULT true,
    "configSchema" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultForNewDpps" BOOLEAN NOT NULL DEFAULT false,
    "systemDefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "feature_registry_key_key" ON "feature_registry"("key");
CREATE INDEX IF NOT EXISTS "feature_registry_category_idx" ON "feature_registry"("category");
CREATE INDEX IF NOT EXISTS "feature_registry_minimumPlan_idx" ON "feature_registry"("minimumPlan");
CREATE INDEX IF NOT EXISTS "feature_registry_systemDefined_idx" ON "feature_registry"("systemDefined");

-- Block Types (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS "block_types" (
    "id" TEXT NOT NULL,
    "featureRegistryId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "configSchema" TEXT NOT NULL,
    "defaultConfig" TEXT,
    "supportsStyling" BOOLEAN NOT NULL DEFAULT false,
    "requiresPublishing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "block_types_key_key" ON "block_types"("key");
CREATE INDEX IF NOT EXISTS "block_types_category_idx" ON "block_types"("category");

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'block_types_featureRegistryId_fkey'
  ) THEN
    ALTER TABLE "block_types" 
    ADD CONSTRAINT "block_types_featureRegistryId_fkey" 
    FOREIGN KEY ("featureRegistryId") REFERENCES "feature_registry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- DPP Content (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS "dpp_content" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "versionId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "blocks" JSONB NOT NULL,
    "styling" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "dpp_content_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dpp_content_dppId_idx" ON "dpp_content"("dppId");
CREATE INDEX IF NOT EXISTS "dpp_content_dppId_isPublished_idx" ON "dpp_content"("dppId", "isPublished");

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dpp_content_dppId_fkey'
  ) THEN
    ALTER TABLE "dpp_content" 
    ADD CONSTRAINT "dpp_content_dppId_fkey" 
    FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- Script abgeschlossen
-- ============================================
-- Nach der Ausführung sollten alle fehlenden Tabellen erstellt sein.
-- Prüfe mit: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- ============================================

