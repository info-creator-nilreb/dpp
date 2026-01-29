-- Add isRepeatable column to template_fields
-- Für wiederholbare Gruppen (z.B. Materialien)

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'template_fields' AND column_name = 'isRepeatable'
  ) THEN
    ALTER TABLE "template_fields" ADD COLUMN "isRepeatable" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;


