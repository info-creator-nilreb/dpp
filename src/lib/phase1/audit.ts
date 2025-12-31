/**
 * Phase 1: Audit Log Integration
 * 
 * Wrapper für Audit-Log-Events spezifisch für Phase 1
 */

import { createAuditLog } from "@/lib/audit/audit-service"
import type { ActionType, EntityType, Source } from "@/lib/audit/audit-service"

/**
 * Phase 1 spezifische Events
 */
export const PHASE1_EVENTS = {
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_COMPANY_DETAILS_UPDATED: "organization.company_details.updated",
  ORGANIZATION_BILLING_UPDATED: "organization.billing.updated",
  USER_INVITED: "user.invited",
  INVITATION_ACCEPTED: "invitation.accepted",
  JOIN_REQUEST_CREATED: "join_request.created",
  JOIN_REQUEST_APPROVED: "join_request.approved",
  JOIN_REQUEST_REJECTED: "join_request.rejected",
  USER_REMOVED_FROM_ORGANIZATION: "user.removed_from_organization",
  USER_PROFILE_UPDATED: "user.profile.updated",
  USER_ASSIGNED_ROLE: "user.assigned_role",
} as const

/**
 * Loggt Organisation-Erstellung
 */
export async function logOrganizationCreated(
  organizationId: string,
  actorId: string,
  actorRole: string
): Promise<void> {
  await createAuditLog({
    actorId,
    actorRole,
    organizationId,
    actionType: "CREATE" as ActionType,
    entityType: "ORGANIZATION" as EntityType,
    entityId: organizationId,
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt Organisation-Update (allgemein)
 */
export async function logOrganizationUpdated(
  actorId: string,
  organizationId: string,
  actorRole: string,
  fieldName: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await createAuditLog({
    actorId,
    actorRole,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "ORGANIZATION" as EntityType,
    entityId: organizationId,
    fieldName,
    oldValue,
    newValue,
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt Company Details Update
 */
export async function logCompanyDetailsUpdated(
  organizationId: string,
  actorId: string,
  actorRole: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await createAuditLog({
    actorId,
    actorRole,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "ORGANIZATION" as EntityType,
    entityId: organizationId,
    fieldName: "company_details",
    oldValue,
    newValue,
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt Billing Update
 */
export async function logBillingUpdated(
  organizationId: string,
  actorId: string,
  actorRole: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await createAuditLog({
    actorId,
    actorRole,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "ORGANIZATION" as EntityType,
    entityId: organizationId,
    fieldName: "billing",
    oldValue,
    newValue,
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt User-Einladung
 */
export async function logUserInvited(
  organizationId: string,
  actorId: string,
  actorRole: string,
  invitedUserId: string,
  role: string
): Promise<void> {
  await createAuditLog({
    actorId,
    actorRole,
    organizationId,
    actionType: "CREATE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: invitedUserId,
    fieldName: "invitation",
    newValue: { role },
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt Invitation-Akzeptierung
 */
export async function logInvitationAccepted(
  organizationId: string,
  userId: string,
  role: string
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    actorRole: role,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: userId,
    fieldName: "invitation",
    newValue: { status: "accepted", role },
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt Join Request-Erstellung
 */
export async function logJoinRequestCreated(
  organizationId: string,
  userId: string
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    actorRole: "VIEWER", // Noch kein Mitglied
    organizationId,
    actionType: "CREATE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: userId,
    fieldName: "join_request",
    newValue: { status: "pending" },
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt Join Request-Genehmigung
 */
export async function logJoinRequestApproved(
  organizationId: string,
  userId: string,
  reviewedById: string,
  reviewedByRole: string
): Promise<void> {
  await createAuditLog({
    actorId: reviewedById,
    actorRole: reviewedByRole,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: userId,
    fieldName: "join_request",
    newValue: { status: "approved" },
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt Join Request-Ablehnung
 */
export async function logJoinRequestRejected(
  organizationId: string,
  userId: string,
  reviewedById: string,
  reviewedByRole: string
): Promise<void> {
  await createAuditLog({
    actorId: reviewedById,
    actorRole: reviewedByRole,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: userId,
    fieldName: "join_request",
    newValue: { status: "rejected" },
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt User-Entfernung
 */
export async function logUserRemoved(
  organizationId: string,
  removedUserId: string,
  removedById: string,
  removedByRole: string
): Promise<void> {
  await createAuditLog({
    actorId: removedById,
    actorRole: removedByRole,
    organizationId,
    actionType: "DELETE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: removedUserId,
    fieldName: "membership",
    oldValue: { status: "active" },
    newValue: { status: "suspended" },
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

/**
 * Loggt User-Profil-Update
 */
export async function logUserProfileUpdated(
  userId: string,
  organizationId: string,
  actorRole: string,
  fieldName: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    actorRole,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: userId,
    fieldName,
    oldValue,
    newValue,
    source: "UI" as Source,
    complianceRelevant: false,
  })
}

/**
 * Loggt Rollen-Zuweisung
 */
export async function logRoleAssigned(
  organizationId: string,
  userId: string,
  assignedById: string,
  assignedByRole: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await createAuditLog({
    actorId: assignedById,
    actorRole: assignedByRole,
    organizationId,
    actionType: "UPDATE" as ActionType,
    entityType: "USER" as EntityType,
    entityId: userId,
    fieldName: "role",
    oldValue: { role: oldRole },
    newValue: { role: newRole },
    source: "UI" as Source,
    complianceRelevant: true,
  })
}

