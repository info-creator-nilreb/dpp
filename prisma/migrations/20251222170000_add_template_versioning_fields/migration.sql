-- Check if templates table exists before modifying
DO $$ 
BEGIN
  -- Only proceed if templates table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'templates'
  ) THEN
    -- AlterTable: Make category NOT NULL (if it was nullable before)
    -- First update any NULL categories to a default value
    UPDATE "templates" SET "category" = 'OTHER' WHERE "category" IS NULL;

    -- Then alter column to NOT NULL if it's not already
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'templates' 
      AND column_name = 'category' 
      AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE "templates" ALTER COLUMN "category" SET NOT NULL;
    END IF;

    -- AlterTable: Add versioning fields to Template
    ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3);
    ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "supersedesVersion" INTEGER;
  END IF;
END $$;

-- Check if template_fields table exists before modifying
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'template_fields'
  ) THEN
    -- AlterTable: Add versioning fields to TemplateField
    ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "regulatoryRequired" BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "introducedInVersion" INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "deprecatedInVersion" INTEGER;

    -- Update existing records: Set introducedInVersion to 1 for all existing fields
    UPDATE "template_fields" SET "introducedInVersion" = 1 WHERE "introducedInVersion" IS NULL;
  END IF;
END $$;

-- Update unique constraint on templates table (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'templates'
  ) THEN
    -- Remove old constraint if it exists (category, version, status)
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'templates_category_version_status_key'
    ) THEN
      ALTER TABLE "templates" DROP CONSTRAINT "templates_category_version_status_key";
    END IF;

    -- Add new unique constraint (category, version) if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'templates_category_version_key'
    ) THEN
      ALTER TABLE "templates" ADD CONSTRAINT "templates_category_version_key" UNIQUE ("category", "version");
    END IF;

    -- Add index for category and status combination
    CREATE INDEX IF NOT EXISTS "templates_category_status_idx" ON "templates"("category", "status");
  END IF;
END $$;

