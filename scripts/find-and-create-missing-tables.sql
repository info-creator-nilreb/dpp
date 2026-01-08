-- ============================================
-- Finde und erstelle fehlende Tabellen
-- ============================================

-- Schritt 1: Zeige welche Tabellen FEHLEN
SELECT 
    expected_table as fehlende_tabelle
FROM (
    VALUES 
        ('dpp_permissions'),
        ('platform_audit_logs')
) AS expected_tables(expected_table)
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = expected_table
);

-- Schritt 2: Erstelle dpp_permissions (nur wenn fehlend)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dpp_permissions'
  ) THEN
    EXECUTE '
    CREATE TABLE "dpp_permissions" (
        "id" TEXT NOT NULL,
        "dppId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "sections" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "dpp_permissions_pkey" PRIMARY KEY ("id")
    )';
    
    EXECUTE 'CREATE UNIQUE INDEX "dpp_permissions_dppId_userId_role_key" ON "dpp_permissions"("dppId", "userId", "role")';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dpps') THEN
        EXECUTE 'ALTER TABLE "dpp_permissions" ADD CONSTRAINT "dpp_permissions_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'ALTER TABLE "dpp_permissions" ADD CONSTRAINT "dpp_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE';
    END IF;
    
    RAISE NOTICE '✓ Tabelle dpp_permissions wurde erstellt';
  ELSE
    RAISE NOTICE '→ Tabelle dpp_permissions existiert bereits';
  END IF;
END $$;

-- Schritt 3: Erstelle platform_audit_logs (nur wenn fehlend)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_audit_logs'
  ) THEN
    EXECUTE '
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
    )';
    
    EXECUTE 'CREATE INDEX "platform_audit_logs_timestamp_idx" ON "platform_audit_logs"("timestamp")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_actorId_idx" ON "platform_audit_logs"("actorId")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_organizationId_idx" ON "platform_audit_logs"("organizationId")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_actionType_idx" ON "platform_audit_logs"("actionType")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_entityType_entityId_idx" ON "platform_audit_logs"("entityType", "entityId")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_source_idx" ON "platform_audit_logs"("source")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_complianceRelevant_idx" ON "platform_audit_logs"("complianceRelevant")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_organizationId_timestamp_idx" ON "platform_audit_logs"("organizationId", "timestamp")';
    EXECUTE 'CREATE INDEX "platform_audit_logs_entityType_entityId_timestamp_idx" ON "platform_audit_logs"("entityType", "entityId", "timestamp")';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        EXECUTE 'ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE';
    END IF;
    
    RAISE NOTICE '✓ Tabelle platform_audit_logs wurde erstellt';
  ELSE
    RAISE NOTICE '→ Tabelle platform_audit_logs existiert bereits';
  END IF;
END $$;

-- Schritt 4: Finale Verifikation
SELECT 
    COUNT(*) as anzahl_tabellen,
    CASE 
        WHEN COUNT(*) = 39 THEN '✓ ALLE TABELLEN VORHANDEN (39/39)'
        WHEN COUNT(*) = 37 THEN '⚠ FEHLEN NOCH 2 TABELLEN'
        ELSE '? Unerwartete Anzahl: ' || COUNT(*)::TEXT
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Schritt 5: Prüfe spezifisch die beiden Tabellen
SELECT 
    'dpp_permissions' as tabelle,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'dpp_permissions'
        ) THEN '✓ VORHANDEN'
        ELSE '✗ FEHLT'
    END as status
UNION ALL
SELECT 
    'platform_audit_logs' as tabelle,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'platform_audit_logs'
        ) THEN '✓ VORHANDEN'
        ELSE '✗ FEHLT'
    END as status;

