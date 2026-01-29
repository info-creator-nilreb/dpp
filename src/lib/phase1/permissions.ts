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
 * WICHTIG: Membership ist die EINZIGE QUELLE DER WAHRHEIT
 * Wenn mehrere Memberships existieren, wird die höchste Rolle zurückgegeben
 * Priorität: ORG_ADMIN > EDITOR > VIEWER
 */
export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<Phase1Role | null> {
  // Hole alle Memberships für diesen User in dieser Organisation
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      organizationId,
    },
    select: { role: true },
  })

  if (memberships.length === 0) {
    return null
  }

  // Wenn mehrere Memberships existieren, wähle die höchste Rolle
  // Priorität: ORG_ADMIN > EDITOR > VIEWER
  const rolePriority: Record<string, number> = {
    [PHASE1_ROLES.ORG_ADMIN]: 3,
    "ORG_OWNER": 3, // Legacy-Rolle, gleiche Priorität wie ORG_ADMIN
    [PHASE1_ROLES.EDITOR]: 2,
    [PHASE1_ROLES.VIEWER]: 1,
  }

  let highestRole: Phase1Role | null = null
  let highestPriority = 0

  for (const membership of memberships) {
    let role: Phase1Role | null = null
    
    // Legacy-Rollen-Mapping: ORG_OWNER → ORG_ADMIN
    if (membership.role === "ORG_OWNER") {
      role = PHASE1_ROLES.ORG_ADMIN
    } else if (isValidPhase1Role(membership.role)) {
      role = membership.role as Phase1Role
    }
    
    if (role) {
      const priority = rolePriority[role] || 0
      if (priority > highestPriority) {
        highestPriority = priority
        highestRole = role
      }
    }
  }

  return highestRole
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

