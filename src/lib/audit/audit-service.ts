/**
 * Platform Audit Service
 * 
 * Zentrale, immutable Audit-Logging-Funktion für alle Aktionen im System.
 * ESPR-aligned, AI-aware, compliance-ready.
 * 
 * Prinzipien:
 * - Append-only, keine Updates oder Deletes
 * - Alle Logs sind immutable
 * - Klare Unterscheidung zwischen Human, System und AI-Aktionen
 * - Human-in-the-loop Governance für AI
 */

import { prisma } from "@/lib/prisma"

/**
 * Action Types
 */
export const ACTION_TYPES = {
  // Human / System Actions
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  PUBLISH: "PUBLISH",
  ARCHIVE: "ARCHIVE",
  EXPORT: "EXPORT",
  ROLE_CHANGE: "ROLE_CHANGE",
  USER_ADDED: "USER_ADDED",
  USER_REMOVED: "USER_REMOVED",
  PERMISSION_CHANGED: "PERMISSION_CHANGED",
  
  // AI-Specific Actions
  AI_SUGGESTION_GENERATED: "AI_SUGGESTION_GENERATED",
  AI_SUGGESTION_ACCEPTED: "AI_SUGGESTION_ACCEPTED",
  AI_SUGGESTION_MODIFIED: "AI_SUGGESTION_MODIFIED",
  AI_SUGGESTION_REJECTED: "AI_SUGGESTION_REJECTED",
  AI_AUTO_FILL_APPLIED: "AI_AUTO_FILL_APPLIED",
  AI_ANALYSIS_RUN: "AI_ANALYSIS_RUN",
  AI_CONFIDENCE_SCORE_UPDATED: "AI_CONFIDENCE_SCORE_UPDATED",
} as const

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES]

/**
 * Entity Types
 */
export const ENTITY_TYPES = {
  DPP: "DPP",
  DPP_VERSION: "DPP_VERSION",
  DPP_CONTENT: "DPP_CONTENT",
  DPP_MEDIA: "DPP_MEDIA",
  USER: "USER",
  ORGANIZATION: "ORGANIZATION",
  MEMBERSHIP: "MEMBERSHIP",
  DPP_PERMISSION: "DPP_PERMISSION",
  TEMPLATE: "TEMPLATE",
  PRICING_PLAN: "PRICING_PLAN",
  SUBSCRIPTION_MODEL: "SUBSCRIPTION_MODEL",
  PRICE: "PRICE",
  ENTITLEMENT: "ENTITLEMENT",
  PRICING_PLAN_FEATURE: "PRICING_PLAN_FEATURE",
  PRICING_PLAN_ENTITLEMENT: "PRICING_PLAN_ENTITLEMENT",
} as const

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES]

/**
 * Source Types
 */
export const SOURCES = {
  UI: "UI",
  API: "API",
  IMPORT: "IMPORT",
  AI: "AI",
  SYSTEM: "SYSTEM",
} as const

export type Source = typeof SOURCES[keyof typeof SOURCES]

/**
 * Regulatory Impact Levels
 */
export const REGULATORY_IMPACT = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type RegulatoryImpact = typeof REGULATORY_IMPACT[keyof typeof REGULATORY_IMPACT]

/**
 * AI Metadata for AI-assisted actions
 */
export interface AIMetadata {
  aiModel: string
  aiModelVersion: string
  aiPromptId?: string // Reference ID only, never raw prompt text
  aiInputSources?: string[] // Array of input source identifiers
  aiConfidenceScore?: number // 0-1
  aiExplainabilityNote?: string
  humanInTheLoop: boolean
  finalDecisionBy: string // user_id or "SYSTEM"
  regulatoryImpact?: RegulatoryImpact
}

/**
 * Base Audit Log Entry
 */
export interface AuditLogEntry {
  actorId?: string // User ID or null for SYSTEM actions
  actorRole?: string
  organizationId?: string
  actionType: ActionType
  entityType: EntityType
  entityId?: string
  fieldName?: string
  oldValue?: any // Will be JSON stringified
  newValue?: any // Will be JSON stringified
  source: Source
  complianceRelevant?: boolean
  versionId?: string
  ipAddress?: string
  metadata?: Record<string, any>
  
  // AI-specific (only when source = AI)
  aiMetadata?: AIMetadata
}

/**
 * Mask IP address for non-admin roles
 */
function maskIpAddress(ipAddress?: string): string | undefined {
  if (!ipAddress) return undefined
  // Simple masking: keep first octet, mask rest
  const parts = ipAddress.split(".")
  if (parts.length === 4) {
    return `${parts[0]}.xxx.xxx.xxx`
  }
  return "xxx.xxx.xxx.xxx"
}

/**
 * Create an audit log entry
 * 
 * This is the main function to log all actions in the system.
 * Logs are immutable and append-only.
 */
export async function createAuditLog(
  entry: AuditLogEntry,
  options?: {
    maskIp?: boolean // Default: true for non-system actions
    adminUserId?: string // If provided, IP won't be masked
  }
): Promise<void> {
  try {
    // Validate AI metadata requirements
    if (entry.source === SOURCES.AI) {
      if (!entry.aiMetadata) {
        throw new Error("AI metadata is required when source = AI")
      }
      
      // Compliance rule: complianceRelevant = true requires humanInTheLoop = true
      if (entry.complianceRelevant && !entry.aiMetadata.humanInTheLoop) {
        throw new Error("complianceRelevant actions require humanInTheLoop = true for AI actions")
      }
    }

    // Mask IP address if not admin
    let ipAddress = entry.ipAddress
    if (ipAddress && (options?.maskIp !== false) && !options?.adminUserId) {
      ipAddress = maskIpAddress(ipAddress)
    }

    // Stringify old/new values
    const oldValueStr = entry.oldValue !== undefined ? JSON.stringify(entry.oldValue) : null
    const newValueStr = entry.newValue !== undefined ? JSON.stringify(entry.newValue) : null

    // Create audit log entry
    await prisma.platformAuditLog.create({
      data: {
        timestamp: new Date(),
        actorId: entry.actorId || null,
        actorRole: entry.actorRole || null,
        organizationId: entry.organizationId || null,
        actionType: entry.actionType,
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        fieldName: entry.fieldName || null,
        oldValue: oldValueStr,
        newValue: newValueStr,
        source: entry.source,
        complianceRelevant: entry.complianceRelevant ?? false,
        versionId: entry.versionId || null,
        ipAddress: ipAddress || null,
        metadata: entry.metadata || undefined,
        
        // AI-specific fields
        aiModel: entry.aiMetadata?.aiModel || null,
        aiModelVersion: entry.aiMetadata?.aiModelVersion || null,
        aiPromptId: entry.aiMetadata?.aiPromptId || null,
        aiInputSources: entry.aiMetadata?.aiInputSources ? JSON.stringify(entry.aiMetadata.aiInputSources) : null,
        aiConfidenceScore: entry.aiMetadata?.aiConfidenceScore || null,
        aiExplainabilityNote: entry.aiMetadata?.aiExplainabilityNote || null,
        humanInTheLoop: entry.aiMetadata?.humanInTheLoop ?? false,
        finalDecisionBy: entry.aiMetadata?.finalDecisionBy || null,
        regulatoryImpact: entry.aiMetadata?.regulatoryImpact || null,
      },
    })
  } catch (error) {
    // Audit logging should never fail silently
    // Log to console but don't throw (to avoid breaking the main operation)
    console.error("[AUDIT] Failed to create audit log:", error)
    console.error("[AUDIT] Entry:", JSON.stringify(entry, null, 2))
  }
}

/**
 * Helper: Create audit log for DPP operations
 */
export async function logDppAction(
  actionType: ActionType,
  dppId: string,
  options: {
    actorId?: string
    actorRole?: string
    organizationId?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    versionId?: string
    ipAddress?: string
    metadata?: Record<string, any>
    aiMetadata?: AIMetadata
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.DPP,
    entityId: dppId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? false,
    versionId: options.versionId,
    ipAddress: options.ipAddress,
    metadata: options.metadata,
    aiMetadata: options.aiMetadata,
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId: options.organizationId,
  })
}

/**
 * Helper: Create audit log for AI actions
 */
export async function logAIAction(
  actionType: ActionType,
  entityType: EntityType,
  entityId: string,
  aiMetadata: AIMetadata,
  options: {
    actorId?: string
    actorRole?: string
    organizationId?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    complianceRelevant?: boolean
    versionId?: string
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType,
    entityId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: SOURCES.AI,
    complianceRelevant: options.complianceRelevant ?? false,
    versionId: options.versionId,
    ipAddress: options.ipAddress,
    metadata: options.metadata,
    aiMetadata,
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId: options.organizationId,
  })
}

/**
 * Helper: Create audit log for system actions
 */
export async function logSystemAction(
  actionType: ActionType,
  entityType: EntityType,
  entityId: string,
  options: {
    organizationId?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    complianceRelevant?: boolean
    versionId?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType,
    entityId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: SOURCES.SYSTEM,
    complianceRelevant: options.complianceRelevant ?? false,
    versionId: options.versionId,
    metadata: options.metadata,
    organizationId: options.organizationId,
    // No actorId for system actions
  })
}

