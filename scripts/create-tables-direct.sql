-- ============================================
-- DIREKT: Erstelle die beiden fehlenden Tabellen
-- OHNE IF NOT EXISTS - zeigt Fehler, falls sie bereits existieren
-- ============================================

-- Tabelle 1: dpp_permissions
CREATE TABLE "dpp_permissions" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sections" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpp_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dpp_permissions_dppId_userId_role_key" ON "dpp_permissions"("dppId", "userId", "role");

ALTER TABLE "dpp_permissions" ADD CONSTRAINT "dpp_permissions_dppId_fkey" 
    FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dpp_permissions" ADD CONSTRAINT "dpp_permissions_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabelle 2: platform_audit_logs
CREATE TABLE "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorRole" TEXT,
    "organizationId" TEXT,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "source" TEXT NOT NULL,
    "complianceRelevant" BOOLEAN NOT NULL DEFAULT false,
    "versionId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "aiModel" TEXT,
    "aiModelVersion" TEXT,
    "aiPromptId" TEXT,
    "aiInputSources" TEXT,
    "aiConfidenceScore" DOUBLE PRECISION,
    "aiExplainabilityNote" TEXT,
    "humanInTheLoop" BOOLEAN,
    "finalDecisionBy" TEXT,
    "regulatoryImpact" TEXT,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_audit_logs_timestamp_idx" ON "platform_audit_logs"("timestamp");
CREATE INDEX "platform_audit_logs_actorId_idx" ON "platform_audit_logs"("actorId");
CREATE INDEX "platform_audit_logs_organizationId_idx" ON "platform_audit_logs"("organizationId");
CREATE INDEX "platform_audit_logs_actionType_idx" ON "platform_audit_logs"("actionType");
CREATE INDEX "platform_audit_logs_entityType_entityId_idx" ON "platform_audit_logs"("entityType", "entityId");
CREATE INDEX "platform_audit_logs_source_idx" ON "platform_audit_logs"("source");
CREATE INDEX "platform_audit_logs_complianceRelevant_idx" ON "platform_audit_logs"("complianceRelevant");
CREATE INDEX "platform_audit_logs_organizationId_timestamp_idx" ON "platform_audit_logs"("organizationId", "timestamp");
CREATE INDEX "platform_audit_logs_entityType_entityId_timestamp_idx" ON "platform_audit_logs"("entityType", "entityId", "timestamp");

ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actorId_fkey" 
    FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Verifikation
SELECT COUNT(*) as anzahl_tabellen FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

