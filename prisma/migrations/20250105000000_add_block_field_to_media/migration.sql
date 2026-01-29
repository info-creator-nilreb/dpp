-- AlterTable: Add blockId and fieldId columns (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dpp_media') THEN
    -- Add columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'dpp_media' AND column_name = 'blockId'
    ) THEN
      ALTER TABLE "dpp_media" ADD COLUMN "blockId" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'dpp_media' AND column_name = 'fieldId'
    ) THEN
      ALTER TABLE "dpp_media" ADD COLUMN "fieldId" TEXT;
    END IF;
  END IF;
END $$;

-- CreateIndex (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dpp_media') THEN
    CREATE INDEX IF NOT EXISTS "dpp_media_dppId_blockId_fieldId_idx" ON "dpp_media"("dppId", "blockId", "fieldId");
  END IF;
END $$;

