-- Add showInTariffCard and tariffCardOrder to pricing_plan_features for tariff card display
ALTER TABLE "pricing_plan_features" ADD COLUMN IF NOT EXISTS "showInTariffCard" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "pricing_plan_features" ADD COLUMN IF NOT EXISTS "tariffCardOrder" INTEGER NOT NULL DEFAULT 0;
