-- CreateTable: Pricing Plans
CREATE TABLE IF NOT EXISTS "pricing_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionMarketing" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Pricing Plan Features
CREATE TABLE IF NOT EXISTS "pricing_plan_features" (
    "id" TEXT NOT NULL,
    "pricingPlanId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "pricing_plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Entitlements
CREATE TABLE IF NOT EXISTS "entitlements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Pricing Plan Entitlements
CREATE TABLE IF NOT EXISTS "pricing_plan_entitlements" (
    "id" TEXT NOT NULL,
    "pricingPlanId" TEXT NOT NULL,
    "entitlementKey" TEXT NOT NULL,
    "value" INTEGER,

    CONSTRAINT "pricing_plan_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Subscription Models
CREATE TABLE IF NOT EXISTS "subscription_models" (
    "id" TEXT NOT NULL,
    "pricingPlanId" TEXT NOT NULL,
    "billingInterval" TEXT NOT NULL,
    "minCommitmentMonths" INTEGER,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Prices
CREATE TABLE IF NOT EXISTS "prices" (
    "id" TEXT NOT NULL,
    "subscriptionModelId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Price Snapshots
CREATE TABLE IF NOT EXISTS "price_snapshots" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "billingInterval" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Entitlement Snapshots
CREATE TABLE IF NOT EXISTS "entitlement_snapshots" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlement_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Pricing Plans
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plans_slug_key" ON "pricing_plans"("slug");
CREATE INDEX IF NOT EXISTS "pricing_plans_isActive_isPublic_idx" ON "pricing_plans"("isActive", "isPublic");
CREATE INDEX IF NOT EXISTS "pricing_plans_displayOrder_idx" ON "pricing_plans"("displayOrder");

-- CreateIndex: Pricing Plan Features
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plan_features_pricingPlanId_featureKey_key" ON "pricing_plan_features"("pricingPlanId", "featureKey");
CREATE INDEX IF NOT EXISTS "pricing_plan_features_pricingPlanId_idx" ON "pricing_plan_features"("pricingPlanId");
CREATE INDEX IF NOT EXISTS "pricing_plan_features_featureKey_idx" ON "pricing_plan_features"("featureKey");

-- CreateIndex: Entitlements
CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_key_key" ON "entitlements"("key");

-- CreateIndex: Pricing Plan Entitlements
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plan_entitlements_pricingPlanId_entitlementKey_key" ON "pricing_plan_entitlements"("pricingPlanId", "entitlementKey");
CREATE INDEX IF NOT EXISTS "pricing_plan_entitlements_pricingPlanId_idx" ON "pricing_plan_entitlements"("pricingPlanId");
CREATE INDEX IF NOT EXISTS "pricing_plan_entitlements_entitlementKey_idx" ON "pricing_plan_entitlements"("entitlementKey");

-- CreateIndex: Subscription Models
CREATE INDEX IF NOT EXISTS "subscription_models_pricingPlanId_idx" ON "subscription_models"("pricingPlanId");
CREATE INDEX IF NOT EXISTS "subscription_models_isActive_idx" ON "subscription_models"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_models_stripePriceId_key" ON "subscription_models"("stripePriceId");

-- CreateIndex: Prices
CREATE INDEX IF NOT EXISTS "prices_subscriptionModelId_idx" ON "prices"("subscriptionModelId");
CREATE INDEX IF NOT EXISTS "prices_isActive_validFrom_validTo_idx" ON "prices"("isActive", "validFrom", "validTo");

-- CreateIndex: Entitlement Snapshots
CREATE UNIQUE INDEX IF NOT EXISTS "entitlement_snapshots_subscriptionId_key_key" ON "entitlement_snapshots"("subscriptionId", "key");
CREATE INDEX IF NOT EXISTS "entitlement_snapshots_subscriptionId_idx" ON "entitlement_snapshots"("subscriptionId");
CREATE INDEX IF NOT EXISTS "entitlement_snapshots_key_idx" ON "entitlement_snapshots"("key");

-- AlterTable: Extend Subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "subscriptionModelId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "priceSnapshotId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);

-- AddForeignKey: Pricing Plan Features -> Pricing Plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pricing_plan_features_pricingPlanId_fkey'
  ) THEN
    ALTER TABLE "pricing_plan_features" 
    ADD CONSTRAINT "pricing_plan_features_pricingPlanId_fkey" 
    FOREIGN KEY ("pricingPlanId") REFERENCES "pricing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Pricing Plan Entitlements -> Pricing Plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pricing_plan_entitlements_pricingPlanId_fkey'
  ) THEN
    ALTER TABLE "pricing_plan_entitlements" 
    ADD CONSTRAINT "pricing_plan_entitlements_pricingPlanId_fkey" 
    FOREIGN KEY ("pricingPlanId") REFERENCES "pricing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Subscription Models -> Pricing Plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscription_models_pricingPlanId_fkey'
  ) THEN
    ALTER TABLE "subscription_models" 
    ADD CONSTRAINT "subscription_models_pricingPlanId_fkey" 
    FOREIGN KEY ("pricingPlanId") REFERENCES "pricing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Prices -> Subscription Models
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'prices_subscriptionModelId_fkey'
  ) THEN
    ALTER TABLE "prices" 
    ADD CONSTRAINT "prices_subscriptionModelId_fkey" 
    FOREIGN KEY ("subscriptionModelId") REFERENCES "subscription_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Subscriptions -> Subscription Models
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_subscriptionModelId_fkey'
  ) THEN
    ALTER TABLE "subscriptions" 
    ADD CONSTRAINT "subscriptions_subscriptionModelId_fkey" 
    FOREIGN KEY ("subscriptionModelId") REFERENCES "subscription_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Subscriptions -> Price Snapshots
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_priceSnapshotId_fkey'
  ) THEN
    ALTER TABLE "subscriptions" 
    ADD CONSTRAINT "subscriptions_priceSnapshotId_fkey" 
    FOREIGN KEY ("priceSnapshotId") REFERENCES "price_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Entitlement Snapshots -> Subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'entitlement_snapshots_subscriptionId_fkey'
  ) THEN
    ALTER TABLE "entitlement_snapshots" 
    ADD CONSTRAINT "entitlement_snapshots_subscriptionId_fkey" 
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

