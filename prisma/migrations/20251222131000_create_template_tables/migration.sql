-- CreateTable: Templates
CREATE TABLE IF NOT EXISTS "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "industry" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Template Blocks
CREATE TABLE IF NOT EXISTS "template_blocks" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Template Fields
CREATE TABLE IF NOT EXISTS "template_fields" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "template_blocks_templateId_idx" ON "template_blocks"("templateId");
CREATE INDEX IF NOT EXISTS "template_blocks_templateId_order_idx" ON "template_blocks"("templateId", "order");
CREATE INDEX IF NOT EXISTS "template_fields_blockId_idx" ON "template_fields"("blockId");
CREATE INDEX IF NOT EXISTS "template_fields_templateId_idx" ON "template_fields"("templateId");
CREATE INDEX IF NOT EXISTS "template_fields_blockId_order_idx" ON "template_fields"("blockId", "order");
CREATE INDEX IF NOT EXISTS "templates_category_idx" ON "templates"("category");
CREATE INDEX IF NOT EXISTS "templates_status_idx" ON "templates"("status");
CREATE INDEX IF NOT EXISTS "templates_industry_idx" ON "templates"("industry");

-- CreateUniqueConstraint
CREATE UNIQUE INDEX IF NOT EXISTS "template_fields_templateId_key_key" ON "template_fields"("templateId", "key");

-- AddForeignKey (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'template_blocks_templateId_fkey'
  ) THEN
    ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'template_fields_blockId_fkey'
  ) THEN
    ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "template_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

