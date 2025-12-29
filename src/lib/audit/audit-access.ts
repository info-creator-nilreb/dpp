/**
 * Audit Log Access Control
 * 
 * Rollenbasierte Zugriffskontrolle für Audit Logs
 */

import { prisma } from "@/lib/prisma"
import { isSuperAdmin, ORGANIZATION_ROLES, EXTERNAL_ROLES } from "@/lib/permissions"
import type { Prisma } from "@prisma/client"

/**
 * Visibility Rules by Role
 */

export interface AuditLogAccessOptions {
  userId: string
  organizationId?: string
  dppId?: string
  includeSystemEvents?: boolean
  includeAIEvents?: boolean
}

/**
 * Check if user can access audit logs
 */
export async function canAccessAuditLogs(
  userId: string,
  organizationId?: string
): Promise<boolean> {
  // Super Admin: Full access
  if (await isSuperAdmin(userId)) {
    return true
  }

  // Organization Admin: Access to their organization's logs
  if (organizationId) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    })

    if (membership) {
      const role = membership.role
      return (
        role === ORGANIZATION_ROLES.ORG_OWNER ||
        role === ORGANIZATION_ROLES.ORG_ADMIN ||
        role === ORGANIZATION_ROLES.ORG_MEMBER
      )
    }
  }

  return false
}

/**
 * Build Prisma where clause based on user role and access options
 */
export async function buildAuditLogWhereClause(
  options: AuditLogAccessOptions
): Promise<Prisma.PlatformAuditLogWhereInput> {
  const { userId, organizationId, dppId, includeSystemEvents = false, includeAIEvents = true } = options

  // Super Admin: Full access (with optional filters)
  // Check if userId starts with "super-admin-" (from super admin session)
  const isSuperAdminUser = userId.startsWith("super-admin-") || await isSuperAdmin(userId)
  
  if (isSuperAdminUser) {
    const where: Prisma.PlatformAuditLogWhereInput = {}

    if (organizationId) {
      where.organizationId = organizationId
    }

    if (dppId) {
      // Filter by DPP entityId
      // DPP_MEDIA filtering: Since metadata might not be set, we'll filter by entityType only
      // The dppId is stored in metadata.dppId, but we'll simplify for now
      where.OR = [
        { entityType: "DPP", entityId: dppId },
        // DPP_MEDIA: Filter by entityType only (metadata filtering can be added later if needed)
        { entityType: "DPP_MEDIA" }
      ]
    }

    // Handle source filters - combine properly
    const sourceFilters: string[] = []
    if (!includeSystemEvents) {
      sourceFilters.push("SYSTEM")
    }
    if (!includeAIEvents) {
      sourceFilters.push("AI")
    }
    
    if (sourceFilters.length > 0) {
      if (sourceFilters.length === 1) {
        where.source = { not: sourceFilters[0] }
      } else {
        where.source = { notIn: sourceFilters }
      }
    }

    return where
  }

  // Organization Admin / Member: Access to their organization's logs
  if (organizationId) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
      include: {
        organization: true,
      },
    })

    if (membership) {
      const role = membership.role
      const where: Prisma.PlatformAuditLogWhereInput = {
        organizationId,
      }

      // Organization Admin: All logs of their organization
      if (role === ORGANIZATION_ROLES.ORG_OWNER || role === ORGANIZATION_ROLES.ORG_ADMIN) {
        // Can see all logs of their organization
        if (dppId) {
          where.OR = [
            { entityType: "DPP", entityId: dppId },
            { entityType: "DPP_MEDIA" }
          ]
        }

        // Never expose internal system events to customers
        const sourceFilters: string[] = ["SYSTEM"]
        if (!includeAIEvents) {
          sourceFilters.push("AI")
        }
        where.source = { notIn: sourceFilters }

        return where
      }

      // Organization Member (Editor): Only logs related to entities they edited
      if (role === ORGANIZATION_ROLES.ORG_MEMBER) {
        where.OR = [
          // Logs where they are the actor
          { actorId: userId },
          // Or logs related to DPPs they have access to
          {
            AND: [
              { entityType: { in: ["DPP", "DPP_MEDIA"] } },
              dppId
                ? {
                    OR: [
                      { entityType: "DPP", entityId: dppId },
                      { entityType: "DPP_MEDIA" }
                    ],
                  }
                : {},
            ],
          },
        ]

        // Never expose internal system events
        const sourceFilters: string[] = ["SYSTEM"]
        if (!includeAIEvents) {
          sourceFilters.push("AI")
        }
        where.source = { notIn: sourceFilters }

        return where
      }

      // Organization Viewer: Limited access (last 7 days only, handled in query)
      if (role === ORGANIZATION_ROLES.ORG_VIEWER) {
        where.actorId = userId // Only their own actions
        where.source = { notIn: ["SYSTEM", "AI"] }
        return where
      }
    }
  }

  // Supplier / Contributor: Only their own contributed data
  const dppPermission = dppId
    ? await prisma.dppPermission.findFirst({
        where: {
          userId,
          dppId,
        },
      })
    : null

  if (dppPermission && dppId) {
    // Supplier/Contributor with DPP permission
    const where: Prisma.PlatformAuditLogWhereInput = {
      actorId: userId,
      source: { notIn: ["SYSTEM"] }, // Never expose system events
      OR: [
        { entityType: "DPP", entityId: dppId },
        { entityType: "DPP_MEDIA" }
      ]
    }

    return where
  }

  // Free / Trial Users: No access or limited to last 7 days
  // Return condition that will return no results
  // Use a condition that will never match any real ID (cuid format)
  return { 
    AND: [
      { id: { startsWith: "no-access-" } },
      { id: { endsWith: "-impossible" } }
    ]
  } // This will return no results
}

/**
 * Check if user can see IP addresses in audit logs
 */
export async function canSeeIpAddresses(userId: string): Promise<boolean> {
  return await isSuperAdmin(userId)
}

/**
 * Check if user can see raw AI prompts
 */
export async function canSeeRawAIPrompts(userId: string): Promise<boolean> {
  // Never expose raw prompts, even to admins
  // Only prompt IDs are stored
  return false
}

