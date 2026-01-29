-- Migration: Template Version Binding
-- Fügt templateId und templateVersionId Spalten zur dpps Tabelle hinzu
-- KEINE Datenänderungen - nur Schema-Erweiterung

-- Add templateId and templateVersionId to DPPs
-- These fields are immutable after DPP creation and bind a DPP to a specific template version

DO $$ 
BEGIN
  -- Add templateId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'dpps' AND column_name = 'templateId'
  ) THEN
    ALTER TABLE "dpps" ADD COLUMN "templateId" TEXT;
    RAISE NOTICE 'Spalte templateId wurde hinzugefügt';
  ELSE
    RAISE NOTICE 'Spalte templateId existiert bereits';
  END IF;

  -- Add templateVersionId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'dpps' AND column_name = 'templateVersionId'
  ) THEN
    ALTER TABLE "dpps" ADD COLUMN "templateVersionId" TEXT;
    RAISE NOTICE 'Spalte templateVersionId wurde hinzugefügt';
  ELSE
    RAISE NOTICE 'Spalte templateVersionId existiert bereits';
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "dpps_templateId_idx" ON "dpps"("templateId");
CREATE INDEX IF NOT EXISTS "dpps_templateVersionId_idx" ON "dpps"("templateVersionId");

-- Verifikation: Prüfe ob Spalten existieren
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'dpps' 
  AND column_name IN ('templateId', 'templateVersionId')
ORDER BY column_name;
