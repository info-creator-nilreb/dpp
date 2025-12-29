/**
 * Audit Log Helper Functions
 * 
 * Convenience functions for logging different entity types
 */

import { createAuditLog, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "./audit-service"
import { getOrganizationRole } from "@/lib/permissions"
import type { ActionType, EntityType, Source } from "./audit-service"

// Re-export ACTION_TYPES and SOURCES for convenience
export { ACTION_TYPES, SOURCES } from "./audit-service"

/**
 * Log Template operations
 */
export async function logTemplateAction(
  actionType: ActionType,
  templateId: string,
  options: {
    actorId?: string
    actorRole?: string
    organizationId?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.TEMPLATE,
    entityId: templateId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? false,
    ipAddress: options.ipAddress,
    metadata: options.metadata,
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId: options.organizationId,
  })
}

/**
 * Log DPP Media operations
 */
export async function logDppMediaAction(
  actionType: ActionType,
  mediaId: string,
  dppId: string,
  options: {
    actorId?: string
    actorRole?: string
    organizationId?: string
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.DPP_MEDIA,
    entityId: mediaId,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? false,
    ipAddress: options.ipAddress,
    metadata: {
      ...options.metadata,
      dppId, // Store DPP reference in metadata
    },
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId: options.organizationId,
  })
}

/**
 * Log Membership operations
 */
export async function logMembershipAction(
  actionType: ActionType,
  membershipId: string,
  options: {
    actorId?: string
    actorRole?: string
    organizationId?: string
    userId?: string
    oldRole?: string
    newRole?: string
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.MEMBERSHIP,
    entityId: membershipId,
    fieldName: options.oldRole && options.newRole ? "role" : undefined,
    oldValue: options.oldRole,
    newValue: options.newRole || options.userId,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? false,
    ipAddress: options.ipAddress,
    metadata: {
      ...options.metadata,
      userId: options.userId,
      organizationId: options.organizationId,
    },
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId: options.organizationId,
  })
}

/**
 * Log DPP Permission operations
 */
export async function logDppPermissionAction(
  actionType: ActionType,
  permissionId: string,
  dppId: string,
  options: {
    actorId?: string
    actorRole?: string
    organizationId?: string
    userId?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.DPP_PERMISSION,
    entityId: permissionId,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? false,
    ipAddress: options.ipAddress,
    metadata: {
      ...options.metadata,
      dppId,
      userId: options.userId,
    },
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId: options.organizationId,
  })
}

/**
 * Log User operations
 */
export async function logUserAction(
  actionType: ActionType,
  userId: string,
  options: {
    actorId?: string
    actorRole?: string
    organizationId?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.USER,
    entityId: userId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? false,
    ipAddress: options.ipAddress,
    metadata: options.metadata,
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId: options.organizationId,
  })
}

/**
 * Log Organization operations
 */
export async function logOrganizationAction(
  actionType: ActionType,
  organizationId: string,
  options: {
    actorId?: string
    actorRole?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.ORGANIZATION,
    entityId: organizationId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? false,
    ipAddress: options.ipAddress,
    metadata: options.metadata,
    actorId: options.actorId,
    actorRole: options.actorRole,
    organizationId, // Also set as organizationId for filtering
  })
}

/**
 * Log Pricing Plan operations
 */
export async function logPricingPlanAction(
  actionType: ActionType,
  pricingPlanId: string,
  options: {
    actorId?: string
    actorRole?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.PRICING_PLAN,
    entityId: pricingPlanId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? true, // Pricing changes are compliance-relevant
    ipAddress: options.ipAddress,
    metadata: options.metadata,
    actorId: options.actorId,
    actorRole: options.actorRole || "SUPER_ADMIN",
  })
}

/**
 * Log Subscription Model operations
 */
export async function logSubscriptionModelAction(
  actionType: ActionType,
  subscriptionModelId: string,
  options: {
    actorId?: string
    actorRole?: string
    pricingPlanId?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.SUBSCRIPTION_MODEL,
    entityId: subscriptionModelId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? true, // Pricing changes are compliance-relevant
    ipAddress: options.ipAddress,
    metadata: {
      ...options.metadata,
      pricingPlanId: options.pricingPlanId,
    },
    actorId: options.actorId,
    actorRole: options.actorRole || "SUPER_ADMIN",
  })
}

/**
 * Log Price operations
 */
export async function logPriceAction(
  actionType: ActionType,
  priceId: string,
  options: {
    actorId?: string
    actorRole?: string
    subscriptionModelId?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.PRICE,
    entityId: priceId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? true, // Price changes are compliance-relevant
    ipAddress: options.ipAddress,
    metadata: {
      ...options.metadata,
      subscriptionModelId: options.subscriptionModelId,
    },
    actorId: options.actorId,
    actorRole: options.actorRole || "SUPER_ADMIN",
  })
}

/**
 * Log Entitlement operations
 */
export async function logEntitlementAction(
  actionType: ActionType,
  entitlementId: string,
  options: {
    actorId?: string
    actorRole?: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.ENTITLEMENT,
    entityId: entitlementId,
    fieldName: options.fieldName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? true, // Entitlement changes are compliance-relevant
    ipAddress: options.ipAddress,
    metadata: options.metadata,
    actorId: options.actorId,
    actorRole: options.actorRole || "SUPER_ADMIN",
  })
}

/**
 * Log Pricing Plan Feature operations
 */
export async function logPricingPlanFeatureAction(
  actionType: ActionType,
  pricingPlanFeatureId: string,
  options: {
    actorId?: string
    actorRole?: string
    pricingPlanId?: string
    featureKey?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.PRICING_PLAN_FEATURE,
    entityId: pricingPlanFeatureId,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? true, // Feature assignment changes are compliance-relevant
    ipAddress: options.ipAddress,
    metadata: {
      ...options.metadata,
      pricingPlanId: options.pricingPlanId,
      featureKey: options.featureKey,
    },
    actorId: options.actorId,
    actorRole: options.actorRole || "SUPER_ADMIN",
  })
}

/**
 * Log Pricing Plan Entitlement operations
 */
export async function logPricingPlanEntitlementAction(
  actionType: ActionType,
  pricingPlanEntitlementId: string,
  options: {
    actorId?: string
    actorRole?: string
    pricingPlanId?: string
    entitlementKey?: string
    oldValue?: any
    newValue?: any
    source?: Source
    complianceRelevant?: boolean
    ipAddress?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    actionType,
    entityType: ENTITY_TYPES.PRICING_PLAN_ENTITLEMENT,
    entityId: pricingPlanEntitlementId,
    oldValue: options.oldValue,
    newValue: options.newValue,
    source: options.source || SOURCES.UI,
    complianceRelevant: options.complianceRelevant ?? true, // Entitlement limit changes are compliance-relevant
    ipAddress: options.ipAddress,
    metadata: {
      ...options.metadata,
      pricingPlanId: options.pricingPlanId,
      entitlementKey: options.entitlementKey,
    },
    actorId: options.actorId,
    actorRole: options.actorRole || "SUPER_ADMIN",
  })
}

