-- Nur Tabellen/Felder anpassen, keine bestehenden Daten überschreiben oder löschen.

-- TemplateField: neue Spalte isRepeatable (bestehende Zeilen erhalten DEFAULT false)
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "isRepeatable" BOOLEAN NOT NULL DEFAULT false;

-- DppContent: neue Spalten fieldValues und fieldInstances (bestehende Zeilen erhalten NULL)
ALTER TABLE "dpp_content" ADD COLUMN IF NOT EXISTS "fieldValues" JSONB;
ALTER TABLE "dpp_content" ADD COLUMN IF NOT EXISTS "fieldInstances" JSONB;
