-- AlterTable: Subscription enterprise fields (Kündigungsfrist, featureOverrides)
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cancellationNoticePeriodDays" INTEGER DEFAULT 14;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "featureOverrides" JSONB;
