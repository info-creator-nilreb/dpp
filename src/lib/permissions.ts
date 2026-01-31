import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  SYSTEM_ROLES,
  ORGANIZATION_ROLES,
  EXTERNAL_ROLES,
  PUBLIC_ROLE,
  DPP_SECTIONS,
  type SystemRole,
  type OrganizationRole,
  type ExternalRole,
  type DppSection,
} from "./permissions-constants"

// Re-export constants for backward compatibility
export {
  SYSTEM_ROLES,
  ORGANIZATION_ROLES,
  EXTERNAL_ROLES,
  PUBLIC_ROLE,
  DPP_SECTIONS,
  type SystemRole,
  type OrganizationRole,
  type ExternalRole,
  type DppSection,
}

/** Prisma-Verbindungsfehler erkennen (DB nicht erreichbar, Pool, etc.) */
function isPrismaConnectionError(e: unknown): boolean {
  const msg = e && typeof (e as { message?: string }).message === "string" ? (e as { message: string }).message : ""
  const code = (e as { code?: string })?.code
  const connectionErrorCodes = ["P1001", "P1002", "P1008", "P1017", "P1031"]
  const connectionErrorPattern = /can't reach|can't connect|reach database|connection refused|connection.*refused|database server|ECONNREFUSED|ETIMEDOUT|getaddrinfo/i
  return (code && connectionErrorCodes.includes(code)) || connectionErrorPattern.test(msg)
}

/**
 * Helper: Prüft ob User Super Admin ist
 */
export async function isSuperAdmin(userId?: string): Promise<boolean> {
  if (!userId) {
    const session = await auth()
    if (!session?.user?.id) return false
    userId = session.user.id
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { systemRole: true, isPlatformAdmin: true }, // isPlatformAdmin für Backward Compatibility
    })
    return user?.systemRole === SYSTEM_ROLES.SUPER_ADMIN || user?.isPlatformAdmin === true
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] isSuperAdmin: DB nicht erreichbar, Fallback false:", (e as Error)?.message)
      return false
    }
    throw e
  }
}

/**
 * Helper: Holt die Organisations-Rolle eines Users
 */
export async function getOrganizationRole(
  userId: string,
  organizationId: string
): Promise<OrganizationRole | null> {
  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: { role: true },
    })
    return (membership?.role as OrganizationRole) || null
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] getOrganizationRole: DB nicht erreichbar, Fallback null:", (e as Error)?.message)
      return null
    }
    throw e
  }
}

/**
 * Helper: Prüft ob User eine Organisations-Rolle hat
 */
export async function hasOrganizationRole(
  userId: string,
  organizationId: string,
  roles: OrganizationRole[]
): Promise<boolean> {
  const role = await getOrganizationRole(userId, organizationId)
  return role !== null && roles.includes(role)
}

/**
 * Helper: Holt DPP-Permissions eines Users
 */
export async function getDppPermission(
  userId: string,
  dppId: string
): Promise<{ role: ExternalRole; sections: string[] | null } | null> {
  try {
    const permission = await prisma.dppPermission.findFirst({
      where: {
        dppId,
        userId,
      },
      select: {
        role: true,
        sections: true,
      },
    })
    if (!permission) return null
    return {
      role: permission.role as ExternalRole,
      sections: permission.sections ? permission.sections.split(",") : null,
    }
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] getDppPermission: DB nicht erreichbar, Fallback null:", (e as Error)?.message)
      return null
    }
    throw e
  }
}

/**
 * Kann User einen DPP ansehen?
 */
export async function canViewDPP(userId: string, dppId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true
  try {
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
            },
          },
        },
      },
    })
    if (!dpp) return false
    const isOrgMember = dpp.organization.memberships.length > 0
    if (isOrgMember) return true
    const permission = await getDppPermission(userId, dppId)
    return permission !== null
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] canViewDPP: DB nicht erreichbar, Fallback false:", (e as Error)?.message)
      return false
    }
    throw e
  }
}

/**
 * Kann User einen DPP bearbeiten?
 */
export async function canEditDPP(userId: string, dppId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true
  try {
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
            },
          },
        },
      },
    })
    if (!dpp) return false
    const membership = dpp.organization.memberships[0]
    if (membership) {
      const role = membership.role as OrganizationRole
      if (role === ORGANIZATION_ROLES.ORG_VIEWER) return false
      return true
    }
    const permission = await getDppPermission(userId, dppId)
    return permission !== null
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] canEditDPP: DB nicht erreichbar, Fallback false:", (e as Error)?.message)
      return false
    }
    throw e
  }
}

/**
 * Kann User eine bestimmte DPP-Sektion bearbeiten?
 */
export async function canEditSection(
  userId: string,
  dppId: string,
  section: DppSection
): Promise<boolean> {
  // Super Admin kann alles bearbeiten
  if (await isSuperAdmin(userId)) return true

  // Basis-Check: Kann User den DPP überhaupt bearbeiten?
  if (!(await canEditDPP(userId, dppId))) return false

  try {
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!dpp) return false

    // Organisations-Mitglieder können alle Sektionen bearbeiten (außer VIEWER)
    const membership = dpp.organization.memberships[0]
    if (membership) {
      const role = membership.role as OrganizationRole
      return role !== ORGANIZATION_ROLES.ORG_VIEWER
    }

    // Externe Rollen: Prüfe Permission
    const permission = await getDppPermission(userId, dppId)
    if (!permission) return false

    // Wenn sections null ist, hat User Zugriff auf alle Sektionen der Rolle
    if (!permission.sections) {
      // Default-Berechtigungen basierend auf Rolle
      switch (permission.role) {
        case EXTERNAL_ROLES.SUPPLIER:
          return section === DPP_SECTIONS.MATERIALS || section === DPP_SECTIONS.MATERIAL_SOURCE
        case EXTERNAL_ROLES.RECYCLER:
          return section === DPP_SECTIONS.DISPOSAL || section === DPP_SECTIONS.SECOND_LIFE
        case EXTERNAL_ROLES.REPAIR_SERVICE:
          return section === DPP_SECTIONS.REPAIR || section === DPP_SECTIONS.CARE
        default:
          return false
      }
    }

    // Prüfe ob Sektion in der Liste ist
    return permission.sections.includes(section)
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] canEditSection: DB nicht erreichbar, Fallback false:", (e as Error)?.message)
      return false
    }
    throw e
  }
}

/**
 * Kann User eine Organisation verwalten?
 */
export async function canManageOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Super Admin kann alles verwalten
  if (await isSuperAdmin(userId)) return true

  // Prüfe Organisations-Rolle
  return hasOrganizationRole(userId, organizationId, [
    ORGANIZATION_ROLES.ORG_OWNER,
    ORGANIZATION_ROLES.ORG_ADMIN,
  ])
}

/**
 * Kann User Organisations-User verwalten? (Invites, Rollen, etc.)
 */
export async function canManageOrganizationUsers(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Super Admin kann alles verwalten
  if (await isSuperAdmin(userId)) return true

  // Nur OWNER und ADMIN können User verwalten
  return hasOrganizationRole(userId, organizationId, [
    ORGANIZATION_ROLES.ORG_OWNER,
    ORGANIZATION_ROLES.ORG_ADMIN,
  ])
}

/**
 * Kann User externe Rollen (SUPPLIER, etc.) zu einem DPP einladen?
 */
export async function canInviteExternalRole(
  userId: string,
  dppId: string
): Promise<boolean> {
  // Super Admin kann alles
  if (await isSuperAdmin(userId)) return true

  try {
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!dpp) return false

    // Nur OWNER und ADMIN können externe Rollen einladen
    const membership = dpp.organization.memberships[0]
    if (!membership) return false

    const role = membership.role as OrganizationRole
    return (
      role === ORGANIZATION_ROLES.ORG_OWNER || role === ORGANIZATION_ROLES.ORG_ADMIN
    )
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] canInviteExternalRole: DB nicht erreichbar, Fallback false:", (e as Error)?.message)
      return false
    }
    throw e
  }
}

/**
 * EU Registry: Kann User nur Compliance-relevante Felder sehen?
 */
export async function isEuRegistry(userId?: string): Promise<boolean> {
  if (!userId) {
    const session = await auth()
    if (!session?.user?.id) return false
    userId = session.user.id
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { systemRole: true },
    })
    return user?.systemRole === SYSTEM_ROLES.EU_REGISTRY
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] isEuRegistry: DB nicht erreichbar, Fallback false:", (e as Error)?.message)
      return false
    }
    throw e
  }
}

/**
 * Helper: Holt alle erlaubten Sektionen für einen User in einem DPP
 */
export async function getAllowedSections(
  userId: string,
  dppId: string
): Promise<DppSection[] | null> {
  // Super Admin kann alles
  if (await isSuperAdmin(userId)) return null // null = alle Sektionen

  try {
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!dpp) return []

    // Organisations-Mitglieder (außer VIEWER) können alle Sektionen
    const membership = dpp.organization.memberships[0]
    if (membership) {
      const role = membership.role as OrganizationRole
      if (role !== ORGANIZATION_ROLES.ORG_VIEWER) {
        return null // null = alle Sektionen
      }
      return [] // VIEWER kann nichts bearbeiten
    }

    // Externe Rollen: Prüfe Permission
    const permission = await getDppPermission(userId, dppId)
    if (!permission) return []

    if (!permission.sections) {
      // Default-Berechtigungen basierend auf Rolle
      switch (permission.role) {
        case EXTERNAL_ROLES.SUPPLIER:
          return [DPP_SECTIONS.MATERIALS, DPP_SECTIONS.MATERIAL_SOURCE]
        case EXTERNAL_ROLES.RECYCLER:
          return [DPP_SECTIONS.DISPOSAL, DPP_SECTIONS.SECOND_LIFE]
        case EXTERNAL_ROLES.REPAIR_SERVICE:
          return [DPP_SECTIONS.REPAIR, DPP_SECTIONS.CARE]
        default:
          return []
      }
    }

    return permission.sections as DppSection[]
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      console.warn("[permissions] getAllowedSections: DB nicht erreichbar, Fallback []:", (e as Error)?.message)
      return []
    }
    throw e
  }
}

