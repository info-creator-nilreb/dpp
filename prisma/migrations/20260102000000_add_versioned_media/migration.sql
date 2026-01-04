-- Add versioned media support
-- This migration adds:
-- 1. DppVersionMedia table for version-bound media
-- 2. Extended DppMedia fields (role, blockId, fieldKey)

-- ============================================
-- 1. Extend DppMedia table with new fields
-- ============================================

-- Add role column (semantic role: primary_product_image, gallery_image, certificate, logo, etc.)
ALTER TABLE "dpp_media"
  ADD COLUMN IF NOT EXISTS "role" TEXT;

-- Add blockId column (optional: ID of the block this media belongs to)
ALTER TABLE "dpp_media"
  ADD COLUMN IF NOT EXISTS "blockId" TEXT;

-- Add fieldKey column (optional: Key of the file field in the block)
ALTER TABLE "dpp_media"
  ADD COLUMN IF NOT EXISTS "fieldKey" TEXT;

-- Create indexes for DppMedia
CREATE INDEX IF NOT EXISTS "dpp_media_dppId_role_idx" ON "dpp_media"("dppId", "role");
CREATE INDEX IF NOT EXISTS "dpp_media_blockId_idx" ON "dpp_media"("blockId");

-- ============================================
-- 2. Create DppVersionMedia table
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

-- Create indexes for DppVersionMedia
CREATE INDEX IF NOT EXISTS "dpp_version_media_versionId_idx" ON "dpp_version_media"("versionId");
CREATE INDEX IF NOT EXISTS "dpp_version_media_versionId_role_idx" ON "dpp_version_media"("versionId", "role");
CREATE INDEX IF NOT EXISTS "dpp_version_media_blockId_idx" ON "dpp_version_media"("blockId");

-- Add foreign key constraint
ALTER TABLE "dpp_version_media"
  ADD CONSTRAINT "dpp_version_media_versionId_fkey" 
  FOREIGN KEY ("versionId") 
  REFERENCES "dpp_versions"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- ============================================
-- Migration Complete
-- ============================================



