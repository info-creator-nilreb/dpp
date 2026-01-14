-- Migration: Move supplierConfig from Template to DPP level
-- 
-- 1. Create new table for DPP-specific supplier configurations
-- 2. Remove supplierConfig column from template_blocks (optional, after migration)

-- Create DPP Block Supplier Config table
CREATE TABLE IF NOT EXISTS "dpp_block_supplier_configs" (
  "id" TEXT NOT NULL,
  "dppId" TEXT NOT NULL,
  "blockId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "mode" TEXT,
  "allowedRoles" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dpp_block_supplier_configs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dpp_block_supplier_configs_dppId_blockId_key" UNIQUE ("dppId", "blockId")
);

-- Add foreign key to DPPs
ALTER TABLE "dpp_block_supplier_configs"
ADD CONSTRAINT "dpp_block_supplier_configs_dppId_fkey"
FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "dpp_block_supplier_configs_dppId_idx"
ON "dpp_block_supplier_configs"("dppId");

-- NOTE: supplierConfig column in template_blocks is kept for now
-- It will be removed in a future migration after all DPPs have been migrated
-- ALTER TABLE "template_blocks" DROP COLUMN IF EXISTS "supplierConfig";


