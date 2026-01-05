-- Phase 1: Organization & User Management Migration
-- Adds: Extended User fields, Organization company details & billing, Invitations, Join Requests, Notifications

-- ============================================
-- 1. User Model Extensions
-- ============================================

-- Add Phase 1 fields to users table (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Add Phase 1 fields to users table
    ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "firstName" TEXT,
      ADD COLUMN IF NOT EXISTS "lastName" TEXT,
      ADD COLUMN IF NOT EXISTS "status" TEXT,
      ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "jobTitle" TEXT,
      ADD COLUMN IF NOT EXISTS "phone" TEXT,
      ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT,
      ADD COLUMN IF NOT EXISTS "timeZone" TEXT,
      ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
    
    -- Set default values for existing rows
    UPDATE "users" SET "status" = 'active' WHERE "status" IS NULL;
    UPDATE "users" SET "preferredLanguage" = 'en' WHERE "preferredLanguage" IS NULL;
    
    -- Add NOT NULL constraints after setting defaults
    ALTER TABLE "users" 
      ALTER COLUMN "status" SET NOT NULL,
      ALTER COLUMN "status" SET DEFAULT 'active',
      ALTER COLUMN "preferredLanguage" SET NOT NULL,
      ALTER COLUMN "preferredLanguage" SET DEFAULT 'en';
  END IF;
END $$;

-- Create indexes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE INDEX IF NOT EXISTS "users_organizationId_idx" ON "users"("organizationId");
    CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
  END IF;
END $$;

-- ============================================
-- 2. Organization Model Extensions
-- ============================================

-- Add Company Details fields (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    -- Add Company Details fields
    ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "legalName" TEXT,
      ADD COLUMN IF NOT EXISTS "companyType" TEXT,
      ADD COLUMN IF NOT EXISTS "vatId" TEXT,
      ADD COLUMN IF NOT EXISTS "commercialRegisterId" TEXT,
      ADD COLUMN IF NOT EXISTS "addressStreet" TEXT,
      ADD COLUMN IF NOT EXISTS "addressZip" TEXT,
      ADD COLUMN IF NOT EXISTS "addressCity" TEXT,
      ADD COLUMN IF NOT EXISTS "addressCountry" TEXT,
      ADD COLUMN IF NOT EXISTS "country" TEXT;

    -- Add Billing Information fields
    ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "billingEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "billingContactUserId" TEXT,
      ADD COLUMN IF NOT EXISTS "invoiceAddressStreet" TEXT,
      ADD COLUMN IF NOT EXISTS "invoiceAddressZip" TEXT,
      ADD COLUMN IF NOT EXISTS "invoiceAddressCity" TEXT,
      ADD COLUMN IF NOT EXISTS "invoiceAddressCountry" TEXT,
      ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "organizations_country_idx" ON "organizations"("country");
  END IF;
END $$;

-- ============================================
-- 3. Add Foreign Key: User -> Organization
-- ============================================

-- Add foreign key constraint (nullable, SetNull on delete)
-- Only add if it doesn't exist and tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'users_organizationId_fkey'
     ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_organizationId_fkey" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 4. Update Membership default role
-- ============================================

-- Change default role from ORG_MEMBER to VIEWER (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
    -- Change default role from ORG_MEMBER to VIEWER
    ALTER TABLE "memberships"
      ALTER COLUMN "role" SET DEFAULT 'VIEWER';

    -- Create index on role
    CREATE INDEX IF NOT EXISTS "memberships_role_idx" ON "memberships"("role");
  END IF;
END $$;

-- ============================================
-- 5. Create Invitations Table
-- ============================================

CREATE TABLE IF NOT EXISTS "invitations" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'VIEWER',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "invitedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on email + organizationId + status
CREATE UNIQUE INDEX IF NOT EXISTS "invitations_email_organizationId_status_key" 
  ON "invitations"("email", "organizationId", "status");

-- Add invitedById column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' AND column_name = 'invitedById'
  ) THEN
    ALTER TABLE "invitations" ADD COLUMN "invitedById" TEXT;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "invitations_organizationId_idx" ON "invitations"("organizationId");
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "invitations_token_key" ON "invitations"("token");
CREATE INDEX IF NOT EXISTS "invitations_status_idx" ON "invitations"("status");
CREATE INDEX IF NOT EXISTS "invitations_expiresAt_idx" ON "invitations"("expiresAt");

-- Add foreign keys (only if they don't exist and referenced tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'invitations_organizationId_fkey'
     ) THEN
    ALTER TABLE "invitations"
      ADD CONSTRAINT "invitations_organizationId_fkey" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'invitations_invitedById_fkey'
     ) THEN
    ALTER TABLE "invitations"
      ADD CONSTRAINT "invitations_invitedById_fkey" 
      FOREIGN KEY ("invitedById") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 6. Create Join Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS "join_requests" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "message" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId + organizationId + status
CREATE UNIQUE INDEX IF NOT EXISTS "join_requests_userId_organizationId_status_key" 
  ON "join_requests"("userId", "organizationId", "status");

-- Create indexes
CREATE INDEX IF NOT EXISTS "join_requests_organizationId_idx" ON "join_requests"("organizationId");
CREATE INDEX IF NOT EXISTS "join_requests_userId_idx" ON "join_requests"("userId");
CREATE INDEX IF NOT EXISTS "join_requests_status_idx" ON "join_requests"("status");

-- Add foreign keys (only if they don't exist and referenced tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'join_requests')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'join_requests_userId_fkey'
     ) THEN
    ALTER TABLE "join_requests"
      ADD CONSTRAINT "join_requests_userId_fkey" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'join_requests')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'join_requests_organizationId_fkey'
     ) THEN
    ALTER TABLE "join_requests"
      ADD CONSTRAINT "join_requests_organizationId_fkey" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 7. Create Notifications Table
-- ============================================

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_userId_read_idx" ON "notifications"("userId", "read");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");

-- Add foreign key (only if it doesn't exist and referenced table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'notifications_userId_fkey'
     ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_userId_fkey" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 8. Data Migration: Migrate existing data
-- ============================================

-- Migrate existing users: Set organizationId from memberships
-- (For users with exactly one membership) - only if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
    -- Migrate existing users: Set organizationId from memberships
    UPDATE "users" u
    SET "organizationId" = (
      SELECT m."organizationId"
      FROM "memberships" m
      WHERE m."userId" = u."id"
      LIMIT 1
    )
    WHERE "organizationId" IS NULL
    AND EXISTS (
      SELECT 1
      FROM "memberships" m
      WHERE m."userId" = u."id"
    );

    -- Migrate name field to firstName/lastName if not set
    -- Split name into firstName and lastName (simple split on first space)
    UPDATE "users"
    SET 
      "firstName" = SPLIT_PART("name", ' ', 1),
      "lastName" = CASE 
        WHEN "name" LIKE '% %' THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
        ELSE NULL
      END
    WHERE "firstName" IS NULL 
    AND "lastName" IS NULL 
    AND "name" IS NOT NULL;

    -- Set status to 'active' for existing users
    UPDATE "users"
    SET "status" = 'active'
    WHERE "status" IS NULL;
  END IF;
END $$;

-- ============================================
-- Migration Complete
-- ============================================

