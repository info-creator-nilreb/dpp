-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "licenseTier" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "category" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "templates_industry_idx" ON "templates"("industry");
