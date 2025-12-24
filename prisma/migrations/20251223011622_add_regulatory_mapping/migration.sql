-- Add regulatoryMapping column to template_fields
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "regulatoryMapping" TEXT;
