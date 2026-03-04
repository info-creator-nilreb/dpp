-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "defaultPaymentMethodId" TEXT;
