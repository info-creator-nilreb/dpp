-- Add defaultStyling (JSON) to organizations for CMS styling defaults (logo, colors)
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "defaultStyling" JSONB;
