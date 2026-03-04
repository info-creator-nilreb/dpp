-- Trial einmal pro Organisation: hasUsedTrial, trialStartedAt, trialEndedAt
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "trialEndedAt" TIMESTAMP(3);
