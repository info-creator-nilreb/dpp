-- AlterTable
ALTER TABLE "feature_registry" ADD COLUMN "systemDefined" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "feature_registry_systemDefined_idx" ON "feature_registry"("systemDefined");

