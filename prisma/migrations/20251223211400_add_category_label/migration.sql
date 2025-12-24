-- AlterTable: Add categoryLabel to Template
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "categoryLabel" TEXT;

