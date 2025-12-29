-- CreateTable
CREATE TABLE "trial_feature_overrides" (
    "id" TEXT NOT NULL,
    "subscriptionModelId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_feature_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_entitlement_overrides" (
    "id" TEXT NOT NULL,
    "subscriptionModelId" TEXT NOT NULL,
    "entitlementKey" TEXT NOT NULL,
    "value" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_entitlement_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trial_feature_overrides_subscriptionModelId_featureKey_key" ON "trial_feature_overrides"("subscriptionModelId", "featureKey");

-- CreateIndex
CREATE INDEX "trial_feature_overrides_subscriptionModelId_idx" ON "trial_feature_overrides"("subscriptionModelId");

-- CreateIndex
CREATE INDEX "trial_feature_overrides_featureKey_idx" ON "trial_feature_overrides"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "trial_entitlement_overrides_subscriptionModelId_entitlementKey_key" ON "trial_entitlement_overrides"("subscriptionModelId", "entitlementKey");

-- CreateIndex
CREATE INDEX "trial_entitlement_overrides_subscriptionModelId_idx" ON "trial_entitlement_overrides"("subscriptionModelId");

-- CreateIndex
CREATE INDEX "trial_entitlement_overrides_entitlementKey_idx" ON "trial_entitlement_overrides"("entitlementKey");

-- AddForeignKey
ALTER TABLE "trial_feature_overrides" ADD CONSTRAINT "trial_feature_overrides_subscriptionModelId_fkey" FOREIGN KEY ("subscriptionModelId") REFERENCES "subscription_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_entitlement_overrides" ADD CONSTRAINT "trial_entitlement_overrides_subscriptionModelId_fkey" FOREIGN KEY ("subscriptionModelId") REFERENCES "subscription_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;


