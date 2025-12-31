/**
 * Phase 1.5: Super Admin Audit Logging
 * 
 * Enhanced audit logging for Super Admin actions with:
 * - Full context (changedFields, reason, severity)
 * - Immutable logs
 * - Compliance-ready
 */

import { createAuditLog, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getHighestSensitivityLevel } from "./organization-sensitivity"

export type SuperAdminActionType =
  | "super_admin.organization.updated"
  | "super_admin.organization.created"
  | "super_admin.organization.suspended"
  | "super_admin.organization.reactivated"
  | "super_admin.organization.admin_assigned"
  | "super_admin.organization.admin_reset"
  | "super_admin.subscription.modified"

export interface SuperAdminAuditEntry {
  actorId: string // Super Admin User ID
  organizationId: string
  actionType: SuperAdminActionType
  entityType: typeof ENTITY_TYPES.ORGANIZATION
  entityId: string
  changedFields: string[] // List of field names that were changed
  before: Record<string, any> // Before state
  after: Record<string, any> // After state
  reason?: string // Required for high-risk changes
  severity: "medium" | "high"
  ipAddress?: string
  userAgent?: string
}

/**
 * Create Super Admin audit log entry
 * 
 * This function ensures all Super Admin actions are properly logged
 * with full context for compliance and accountability.
 */
export async function createSuperAdminAuditLog(
  entry: SuperAdminAuditEntry
): Promise<void> {
  // Map Super Admin action types to standard action types
  const actionTypeMap: Record<SuperAdminActionType, string> = {
    "super_admin.organization.updated": ACTION_TYPES.UPDATE,
    "super_admin.organization.created": ACTION_TYPES.CREATE,
    "super_admin.organization.suspended": ACTION_TYPES.UPDATE,
    "super_admin.organization.reactivated": ACTION_TYPES.UPDATE,
    "super_admin.organization.admin_assigned": ACTION_TYPES.ROLE_CHANGE,
    "super_admin.organization.admin_reset": ACTION_TYPES.ROLE_CHANGE,
    "super_admin.subscription.modified": ACTION_TYPES.UPDATE,
  }

  const standardActionType = actionTypeMap[entry.actionType] || ACTION_TYPES.UPDATE

  // Build metadata with Super Admin specific information
  const metadata: Record<string, any> = {
    superAdminAction: entry.actionType,
    changedFields: entry.changedFields,
    severity: entry.severity,
    ...(entry.reason && { reason: entry.reason }),
  }

  // Create audit log using the platform audit service
  await createAuditLog(
    {
      actorId: entry.actorId,
      actorRole: "SUPER_ADMIN",
      organizationId: entry.organizationId,
      actionType: standardActionType as any,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValue: entry.before,
      newValue: entry.after,
      source: SOURCES.UI,
      complianceRelevant: entry.severity === "high",
      ipAddress: entry.ipAddress,
      metadata,
    },
    {
      maskIp: false, // Super Admin IPs are not masked
      adminUserId: entry.actorId,
    }
  )
}

/**
 * Helper: Log Super Admin organization update
 */
export async function logSuperAdminOrganizationUpdate(
  actorId: string,
  organizationId: string,
  changedFields: string[],
  before: Record<string, any>,
  after: Record<string, any>,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const severity = getHighestSensitivityLevel(changedFields) === "high" ? "high" : "medium"

  await createSuperAdminAuditLog({
    actorId,
    organizationId,
    actionType: "super_admin.organization.updated",
    entityType: ENTITY_TYPES.ORGANIZATION,
    entityId: organizationId,
    changedFields,
    before,
    after,
    reason,
    severity,
    ipAddress,
    userAgent,
  })
}

/**
 * Helper: Log Super Admin organization creation
 */
export async function logSuperAdminOrganizationCreation(
  actorId: string,
  organizationId: string,
  organizationData: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSuperAdminAuditLog({
    actorId,
    organizationId,
    actionType: "super_admin.organization.created",
    entityType: ENTITY_TYPES.ORGANIZATION,
    entityId: organizationId,
    changedFields: Object.keys(organizationData),
    before: {},
    after: organizationData,
    severity: "high", // Creation is always high severity
    ipAddress,
    userAgent,
  })
}

/**
 * Helper: Log Super Admin organization suspension
 */
export async function logSuperAdminOrganizationSuspension(
  actorId: string,
  organizationId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSuperAdminAuditLog({
    actorId,
    organizationId,
    actionType: "super_admin.organization.suspended",
    entityType: ENTITY_TYPES.ORGANIZATION,
    entityId: organizationId,
    changedFields: ["status"],
    before: { status: "active" },
    after: { status: "suspended" },
    reason,
    severity: "high",
    ipAddress,
    userAgent,
  })
}

/**
 * Helper: Log Super Admin organization reactivation
 */
export async function logSuperAdminOrganizationReactivation(
  actorId: string,
  organizationId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSuperAdminAuditLog({
    actorId,
    organizationId,
    actionType: "super_admin.organization.reactivated",
    entityType: ENTITY_TYPES.ORGANIZATION,
    entityId: organizationId,
    changedFields: ["status"],
    before: { status: "suspended" },
    after: { status: "active" },
    reason,
    severity: "high",
    ipAddress,
    userAgent,
  })
}

