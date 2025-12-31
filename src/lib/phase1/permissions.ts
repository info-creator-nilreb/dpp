/**
 * Phase 1: Permission-System (RBAC light)
 * 
 * Serverseitige Permission-Checks für alle Aktionen.
 * Kein UI-Zugriff ohne Backend-Permission-Check.
 */

import { prisma } from "@/lib/prisma"
import { PHASE1_ROLES, Phase1Role, isValidPhase1Role } from "./roles"

/**
 * Permission-Matrix für Phase 1
 */
const PERMISSION_MATRIX: Record<Phase1Role, {
  canEditOrganization: boolean
  canEditBilling: boolean
  canInviteUsers: boolean
  canRemoveUsers: boolean
  canManageJoinRequests: boolean
  canCreateDPP: boolean
  canEditDPP: boolean
  canPublishDPP: boolean
  canViewAuditLogs: boolean
}> = {
  [PHASE1_ROLES.ORG_ADMIN]: {
    canEditOrganization: true,
    canEditBilling: true,
    canInviteUsers: true,
    canRemoveUsers: true,
    canManageJoinRequests: true,
    canCreateDPP: true,
    canEditDPP: true,
    canPublishDPP: true,
    canViewAuditLogs: true,
  },
  [PHASE1_ROLES.EDITOR]: {
    canEditOrganization: false,
    canEditBilling: false,
    canInviteUsers: false,
    canRemoveUsers: false,
    canManageJoinRequests: false,
    canCreateDPP: true,
    canEditDPP: true,
    canPublishDPP: false,
    canViewAuditLogs: false,
  },
  [PHASE1_ROLES.VIEWER]: {
    canEditOrganization: false,
    canEditBilling: false,
    canInviteUsers: false,
    canRemoveUsers: false,
    canManageJoinRequests: false,
    canCreateDPP: false,
    canEditDPP: false,
    canPublishDPP: false,
    canViewAuditLogs: false,
  },
}

/**
 * Holt die Rolle eines Users in einer Organisation
 * 
 * Phase 1: Ein User gehört genau einer Organisation
 * Die Rolle wird aus der organizationId des Users ermittelt
 */
export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<Phase1Role | null> {
  // Prüfe ob User zur Organisation gehört
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })

  if (!user || user.organizationId !== organizationId) {
    return null
  }

  // Hole Rolle aus Membership (Legacy-Support) oder aus User.organizationId
  // In Phase 1 sollte die Rolle primär aus Membership kommen
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: { role: true },
  })

  if (membership && isValidPhase1Role(membership.role)) {
    return membership.role as Phase1Role
  }

  // Fallback: Wenn kein Membership existiert, aber User zur Org gehört
  // (kann während Migration passieren)
  return null
}

/**
 * Prüft ob User eine bestimmte Rolle hat
 */
export async function hasRole(
  userId: string,
  organizationId: string,
  roles: Phase1Role[]
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  return role !== null && roles.includes(role)
}

/**
 * Prüft ob User Organisation bearbeiten kann
 */
export async function canEditOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canEditOrganization
}

/**
 * Prüft ob User Billing bearbeiten kann
 */
export async function canEditBilling(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canEditBilling
}

/**
 * Prüft ob User User einladen kann
 */
export async function canInviteUsers(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canInviteUsers
}

/**
 * Prüft ob User User entfernen kann
 */
export async function canRemoveUsers(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canRemoveUsers
}

/**
 * Prüft ob User Join Requests bearbeiten kann
 */
export async function canManageJoinRequests(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canManageJoinRequests
}

/**
 * Prüft ob User DPP erstellen kann
 */
export async function canCreateDPP(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canCreateDPP
}

/**
 * Prüft ob User DPP bearbeiten kann
 */
export async function canEditDPP(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canEditDPP
}

/**
 * Prüft ob User DPP veröffentlichen kann
 */
export async function canPublishDPP(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canPublishDPP
}

/**
 * Prüft ob User Audit Logs sehen kann
 */
export async function canViewAuditLogs(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return PERMISSION_MATRIX[role].canViewAuditLogs
}

/**
 * Prüft ob User ORG_ADMIN ist
 */
export async function isOrgAdmin(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return hasRole(userId, organizationId, [PHASE1_ROLES.ORG_ADMIN])
}

