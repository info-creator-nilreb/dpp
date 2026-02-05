-- Notification: add deep-link and audit fields (event types: lib/notifications)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "targetRoute" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "targetEntityId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "targetTab" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actorRole" TEXT;
