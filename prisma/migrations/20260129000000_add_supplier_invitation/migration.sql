-- CreateTable (nur dpp_supplier_invites; dpp_block_supplier_configs existiert bereits via 20260110000000)
CREATE TABLE "dpp_supplier_invites" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "message" TEXT,
    "partnerRole" TEXT NOT NULL,
    "blockIds" JSONB NOT NULL,
    "fieldInstances" JSONB NOT NULL,
    "supplierMode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "emailSentAt" TIMESTAMP(3),
    "token" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dpp_supplier_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dpp_supplier_invites_dppId_idx" ON "dpp_supplier_invites"("dppId");

-- CreateIndex
CREATE INDEX "dpp_supplier_invites_token_idx" ON "dpp_supplier_invites"("token");

-- CreateIndex (UNIQUE für token)
CREATE UNIQUE INDEX "dpp_supplier_invites_token_key" ON "dpp_supplier_invites"("token");

-- AddForeignKey
ALTER TABLE "dpp_supplier_invites" ADD CONSTRAINT "dpp_supplier_invites_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
