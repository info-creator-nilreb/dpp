-- AlterTable: Add trial fields to subscriptions
ALTER TABLE "subscriptions" 
  ADD COLUMN IF NOT EXISTS "trialExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);

-- AlterTable: Update defaults for subscriptions
ALTER TABLE "subscriptions" 
  ALTER COLUMN "plan" SET DEFAULT 'basic',
  ALTER COLUMN "status" SET DEFAULT 'trial_active';

-- AddForeignKey: Subscriptions -> Organizations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_organizationId_fkey'
  ) THEN
    ALTER TABLE "subscriptions" 
    ADD CONSTRAINT "subscriptions_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable: FeatureRegistry
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: FeatureRegistry
CREATE UNIQUE INDEX IF NOT EXISTS "feature_registry_key_key" ON "feature_registry"("key");
CREATE INDEX IF NOT EXISTS "feature_registry_category_idx" ON "feature_registry"("category");
CREATE INDEX IF NOT EXISTS "feature_registry_minimumPlan_idx" ON "feature_registry"("minimumPlan");

-- CreateTable: BlockType
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

-- CreateIndex: BlockType
CREATE UNIQUE INDEX IF NOT EXISTS "block_types_key_key" ON "block_types"("key");
CREATE INDEX IF NOT EXISTS "block_types_category_idx" ON "block_types"("category");

-- AddForeignKey: BlockType -> FeatureRegistry
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

-- CreateTable: DppContent
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

-- CreateIndex: DppContent
CREATE INDEX IF NOT EXISTS "dpp_content_dppId_idx" ON "dpp_content"("dppId");
CREATE INDEX IF NOT EXISTS "dpp_content_dppId_isPublished_idx" ON "dpp_content"("dppId", "isPublished");

-- AddForeignKey: DppContent -> Dpp
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

