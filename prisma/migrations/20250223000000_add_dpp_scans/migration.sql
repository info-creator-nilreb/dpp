-- CreateTable
CREATE TABLE "dpp_scans" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region" TEXT,
    "version" INTEGER,

    CONSTRAINT "dpp_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dpp_scans_dppId_idx" ON "dpp_scans"("dppId");

-- CreateIndex
CREATE INDEX "dpp_scans_dppId_scannedAt_idx" ON "dpp_scans"("dppId", "scannedAt");

-- CreateIndex
CREATE INDEX "dpp_scans_scannedAt_idx" ON "dpp_scans"("scannedAt");

-- AddForeignKey
ALTER TABLE "dpp_scans" ADD CONSTRAINT "dpp_scans_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
