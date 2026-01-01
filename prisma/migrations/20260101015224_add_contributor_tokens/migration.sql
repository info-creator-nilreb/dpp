-- CreateTable
CREATE TABLE "contributor_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "partnerRole" TEXT NOT NULL,
    "sections" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestedBy" TEXT,
    "submittedData" JSONB,

    CONSTRAINT "contributor_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contributor_tokens_token_key" ON "contributor_tokens"("token");

-- CreateIndex
CREATE INDEX "contributor_tokens_token_idx" ON "contributor_tokens"("token");

-- CreateIndex
CREATE INDEX "contributor_tokens_dppId_idx" ON "contributor_tokens"("dppId");

-- CreateIndex
CREATE INDEX "contributor_tokens_email_idx" ON "contributor_tokens"("email");

-- CreateIndex
CREATE INDEX "contributor_tokens_status_idx" ON "contributor_tokens"("status");

-- CreateIndex
CREATE INDEX "contributor_tokens_expiresAt_idx" ON "contributor_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "contributor_tokens" ADD CONSTRAINT "contributor_tokens_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

