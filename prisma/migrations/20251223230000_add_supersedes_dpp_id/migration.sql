-- AlterTable: Add supersedesDppId to dpps table
-- This field is used to track when a DPP supersedes another DPP (for category corrections per ESPR)
ALTER TABLE "dpps" ADD COLUMN IF NOT EXISTS "supersedesDppId" TEXT;

