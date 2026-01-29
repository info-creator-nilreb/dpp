-- Fix für Produktion: blockId und fieldId zu dpp_media hinzufügen
-- Dieses Script kann sicher mehrfach ausgeführt werden

DO $$ 
BEGIN
  -- Prüfe und füge blockId hinzu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dpp_media' 
    AND column_name = 'blockId'
  ) THEN
    ALTER TABLE "dpp_media" ADD COLUMN "blockId" TEXT;
    RAISE NOTICE 'Spalte blockId wurde zu dpp_media hinzugefügt';
  ELSE
    RAISE NOTICE 'Spalte blockId existiert bereits';
  END IF;

  -- Prüfe und füge fieldId hinzu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dpp_media' 
    AND column_name = 'fieldId'
  ) THEN
    ALTER TABLE "dpp_media" ADD COLUMN "fieldId" TEXT;
    RAISE NOTICE 'Spalte fieldId wurde zu dpp_media hinzugefügt';
  ELSE
    RAISE NOTICE 'Spalte fieldId existiert bereits';
  END IF;

  -- Erstelle Index, falls er nicht existiert
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'dpp_media' 
    AND indexname = 'dpp_media_dppId_blockId_fieldId_idx'
  ) THEN
    CREATE INDEX "dpp_media_dppId_blockId_fieldId_idx" ON "dpp_media"("dppId", "blockId", "fieldId");
    RAISE NOTICE 'Index dpp_media_dppId_blockId_fieldId_idx wurde erstellt';
  ELSE
    RAISE NOTICE 'Index dpp_media_dppId_blockId_fieldId_idx existiert bereits';
  END IF;
END $$;
