-- Add supplierConfig to template_blocks (nur wenn Spalte nicht existiert)
-- KEINE DATEN werden gelöscht oder verändert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'template_blocks' AND column_name = 'supplierConfig'
  ) THEN
    ALTER TABLE "template_blocks" ADD COLUMN "supplierConfig" JSONB;
  END IF;
END $$;

-- Add blockIds to contributor_tokens (nur wenn Spalte nicht existiert)
-- KEINE DATEN werden gelöscht oder verändert - sections bleibt unverändert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'contributor_tokens' AND column_name = 'blockIds'
  ) THEN
    ALTER TABLE "contributor_tokens" ADD COLUMN "blockIds" TEXT;
  END IF;
END $$;

-- Add supplierMode to contributor_tokens (nur wenn Spalte nicht existiert)
-- KEINE DATEN werden gelöscht oder verändert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'contributor_tokens' AND column_name = 'supplierMode'
  ) THEN
    ALTER TABLE "contributor_tokens" ADD COLUMN "supplierMode" TEXT;
  END IF;
END $$;

-- Make sections nullable (for backward compatibility)
-- WICHTIG: Bestehende sections-Daten bleiben vollständig erhalten - nur Constraint wird geändert
-- KEINE Daten werden verändert oder gelöscht
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contributor_tokens' 
    AND column_name = 'sections' 
    AND is_nullable = 'NO'
  ) THEN
    -- Mache Spalte nullable - bestehende Werte bleiben unverändert
    ALTER TABLE "contributor_tokens" ALTER COLUMN "sections" DROP NOT NULL;
  END IF;
END $$;

-- Add index for blockIds (nur wenn Index nicht existiert)
-- KEINE DATEN werden gelöscht oder verändert
CREATE INDEX IF NOT EXISTS "contributor_tokens_blockIds_idx" ON "contributor_tokens"("blockIds");

