-- CreateTable
CREATE TABLE IF NOT EXISTS "password_protection_config" (
    "id" TEXT NOT NULL,
    "passwordProtectionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "passwordProtectionStartDate" TIMESTAMP(3),
    "passwordProtectionEndDate" TIMESTAMP(3),
    "passwordProtectionPasswordHash" TEXT,
    "passwordProtectionSessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedBy" TEXT,

    CONSTRAINT "password_protection_config_pkey" PRIMARY KEY ("id")
);

