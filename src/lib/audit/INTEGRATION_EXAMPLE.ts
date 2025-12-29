/**
 * INTEGRATION EXAMPLES
 * 
 * Beispiele für die Integration von Audit Logging in bestehende Operationen
 */

import { logDppAction, logAIAction, logSystemAction, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "./audit-service"
import { getOrganizationRole, ORGANIZATION_ROLES } from "@/lib/permissions"

/**
 * Example 1: Log DPP Update
 * 
 * Integrate into PUT /api/app/dpp/[dppId]
 */
export async function exampleLogDppUpdate(
  dppId: string,
  userId: string,
  organizationId: string,
  fieldName: string,
  oldValue: any,
  newValue: any,
  ipAddress?: string
) {
  // Get user's role
  const role = await getOrganizationRole(userId, organizationId)
  
  // Determine if compliance-relevant (example: certain fields are always compliance-relevant)
  const complianceRelevantFields = [
    "materials",
    "materialSource",
    "conformityDeclaration",
    "disposalInfo",
  ]
  const isComplianceRelevant = complianceRelevantFields.includes(fieldName)

  // Log the update
  await logDppAction(ACTION_TYPES.UPDATE, dppId, {
    actorId: userId,
    actorRole: role || undefined,
    organizationId,
    fieldName,
    oldValue,
    newValue,
    source: SOURCES.UI,
    complianceRelevant: isComplianceRelevant,
    ipAddress,
  })
}

/**
 * Example 2: Log AI Suggestion Accepted
 * 
 * Integrate into AI suggestion acceptance flow
 */
export async function exampleLogAISuggestionAccepted(
  dppId: string,
  userId: string,
  organizationId: string,
  fieldName: string,
  oldValue: any,
  newValue: any,
  aiMetadata: {
    aiModel: string
    aiModelVersion: string
    aiPromptId: string
    aiInputSources: string[]
    aiConfidenceScore: number
    aiExplainabilityNote: string
    regulatoryImpact: "low" | "medium" | "high"
  },
  ipAddress?: string
) {
  const role = await getOrganizationRole(userId, organizationId)
  const complianceRelevantFields = [
    "materials",
    "materialSource",
    "conformityDeclaration",
    "disposalInfo",
  ]
  const isComplianceRelevant = complianceRelevantFields.includes(fieldName)

  // Log AI action with human-in-the-loop
  await logAIAction(
    ACTION_TYPES.AI_SUGGESTION_ACCEPTED,
    ENTITY_TYPES.DPP,
    dppId,
    {
      ...aiMetadata,
      humanInTheLoop: true, // Required for compliance-relevant actions
      finalDecisionBy: userId,
    },
    {
      actorId: userId,
      actorRole: role || undefined,
      organizationId,
      fieldName,
      oldValue,
      newValue,
      complianceRelevant: isComplianceRelevant,
      ipAddress,
    }
  )
}

/**
 * Example 3: Log DPP Publish
 * 
 * Integrate into POST /api/app/dpp/[dppId]/publish
 */
export async function exampleLogDppPublish(
  dppId: string,
  versionId: string,
  userId: string,
  organizationId: string,
  ipAddress?: string
) {
  const role = await getOrganizationRole(userId, organizationId)

  await logDppAction(ACTION_TYPES.PUBLISH, dppId, {
    actorId: userId,
    actorRole: role || undefined,
    organizationId,
    source: SOURCES.UI,
    complianceRelevant: true, // Publishing is always compliance-relevant
    versionId,
    ipAddress,
  })
}

/**
 * Example 4: Log System Action
 * 
 * Integrate into automated system processes
 */
export async function exampleLogSystemAction(
  entityType: string,
  entityId: string,
  actionType: string,
  organizationId?: string
) {
  await logSystemAction(
    actionType as any,
    entityType as any,
    entityId,
    {
      organizationId,
      complianceRelevant: false, // System actions are typically not compliance-relevant
    }
  )
}

/**
 * Example 5: Complete Integration in DPP Update Route
 * 
 * This shows how to integrate audit logging into an existing API route
 */
export async function exampleCompleteDppUpdateIntegration(
  dppId: string,
  userId: string,
  updates: Record<string, { old: any; new: any }>,
  ipAddress?: string
) {
  // 1. Load DPP to get organization
  const dpp = await prisma.dpp.findUnique({
    where: { id: dppId },
    select: { organizationId: true },
  })

  if (!dpp) {
    throw new Error("DPP not found")
  }

  // 2. Get user role
  const role = await getOrganizationRole(userId, dpp.organizationId)

  // 3. Log each field change separately
  for (const [fieldName, { old, new: newValue }] of Object.entries(updates)) {
    await logDppAction(ACTION_TYPES.UPDATE, dppId, {
      actorId: userId,
      actorRole: role || undefined,
      organizationId: dpp.organizationId,
      fieldName,
      oldValue: old,
      newValue,
      source: SOURCES.API,
      complianceRelevant: isComplianceRelevantField(fieldName),
      ipAddress,
    })
  }
}

function isComplianceRelevantField(fieldName: string): boolean {
  const complianceFields = [
    "materials",
    "materialSource",
    "conformityDeclaration",
    "disposalInfo",
    "countryOfOrigin",
  ]
  return complianceFields.includes(fieldName)
}

// Import prisma for example
import { prisma } from "@/lib/prisma"


