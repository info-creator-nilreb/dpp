import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DPP_SECTIONS, type DppSection } from "@/lib/dpp-sections"

/**
 * Rollen-Definitionen
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  EU_REGISTRY: "EU_REGISTRY",
} as const

export const ORGANIZATION_ROLES = {
  ORG_OWNER: "ORG_OWNER",
  ORG_ADMIN: "ORG_ADMIN",
  ORG_MEMBER: "ORG_MEMBER",
  ORG_VIEWER: "ORG_VIEWER",
} as const

export const EXTERNAL_ROLES = {
  SUPPLIER: "SUPPLIER",
  RECYCLER: "RECYCLER",
  REPAIR_SERVICE: "REPAIR_SERVICE",
} as const

export const PUBLIC_ROLE = "PUBLIC" as const

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES]
export type OrganizationRole = typeof ORGANIZATION_ROLES[keyof typeof ORGANIZATION_ROLES]
export type ExternalRole = typeof EXTERNAL_ROLES[keyof typeof EXTERNAL_ROLES]

/**
 * DPP-Sektionen für granulare Berechtigungen
 * Imported from @/lib/dpp-sections to avoid bundling issues in client components
 */
// Re-export for backwards compatibility
export { DPP_SECTIONS, type DppSection } from "@/lib/dpp-sections"

/**
 * Helper: Prüft ob User Super Admin ist
 */
export async function isSuperAdmin(userId?: string): Promise<boolean> {
  if (!userId) {
    const session = await auth()
    if (!session?.user?.id) return false
    userId = session.user.id
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, isPlatformAdmin: true }, // isPlatformAdmin für Backward Compatibility
  })

  return user?.systemRole === SYSTEM_ROLES.SUPER_ADMIN || user?.isPlatformAdmin === true
}

/**
 * Helper: Holt die Organisations-Rolle eines Users
 */
export async function getOrganizationRole(
  userId: string,
  organizationId: string
): Promise<OrganizationRole | null> {
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
}

/**
 * Kann User einen DPP ansehen?
 */
export async function canViewDPP(userId: string, dppId: string): Promise<boolean> {
  // Super Admin kann alles sehen
  if (await isSuperAdmin(userId)) return true

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

  // User muss Mitglied der Organisation sein oder DPP-Permission haben
  const isOrgMember = dpp.organization.memberships.length > 0
  if (isOrgMember) return true

  // Oder externe Permission
  const permission = await getDppPermission(userId, dppId)
  return permission !== null
}

/**
 * Kann User einen DPP bearbeiten?
 */
export async function canEditDPP(userId: string, dppId: string): Promise<boolean> {
  // Super Admin kann alles bearbeiten
  if (await isSuperAdmin(userId)) return true

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

  // Prüfe Organisations-Rolle
  const membership = dpp.organization.memberships[0]
  if (membership) {
    const role = membership.role as OrganizationRole
    // ORG_VIEWER kann nicht bearbeiten
    if (role === ORGANIZATION_ROLES.ORG_VIEWER) return false
    // Alle anderen Organisations-Rollen können bearbeiten
    return true
  }

  // Externe Rollen können grundsätzlich bearbeiten (aber nur bestimmte Sektionen)
  const permission = await getDppPermission(userId, dppId)
  return permission !== null
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true },
  })

  return user?.systemRole === SYSTEM_ROLES.EU_REGISTRY
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
}

