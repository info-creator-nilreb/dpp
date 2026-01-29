-- CreateTable
CREATE TABLE "dpp_block_supplier_configs" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" TEXT,
    "allowedRoles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dpp_block_supplier_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
CREATE UNIQUE INDEX "dpp_block_supplier_configs_dppId_blockId_key" ON "dpp_block_supplier_configs"("dppId", "blockId");

-- CreateIndex
CREATE INDEX "dpp_block_supplier_configs_dppId_idx" ON "dpp_block_supplier_configs"("dppId");

-- CreateIndex
CREATE INDEX "dpp_supplier_invites_dppId_idx" ON "dpp_supplier_invites"("dppId");

-- CreateIndex
CREATE INDEX "dpp_supplier_invites_email_idx" ON "dpp_supplier_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dpp_supplier_invites_token_key" ON "dpp_supplier_invites"("token");

-- CreateIndex
CREATE INDEX "dpp_supplier_invites_token_idx" ON "dpp_supplier_invites"("token");

-- CreateIndex
CREATE INDEX "dpp_supplier_invites_status_idx" ON "dpp_supplier_invites"("status");

-- AddForeignKey
ALTER TABLE "dpp_block_supplier_configs" ADD CONSTRAINT "dpp_block_supplier_configs_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpp_supplier_invites" ADD CONSTRAINT "dpp_supplier_invites_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
