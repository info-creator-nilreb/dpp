-- Add blockId and fieldId columns to dpp_media table
ALTER TABLE "dpp_media" ADD COLUMN IF NOT EXISTS "blockId" TEXT;
ALTER TABLE "dpp_media" ADD COLUMN IF NOT EXISTS "fieldId" TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS "dpp_media_dppId_blockId_fieldId_idx" ON "dpp_media"("dppId", "blockId", "fieldId");

