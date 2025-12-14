import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

/**
 * DPP Access-Control Helper-Funktionen
 * 
 * Prüft Zugriff auf DPPs basierend auf Organization-Membership
 */

/**
 * Prüft ob User Zugriff auf einen DPP hat
 * 
 * @param dppId - ID des DPPs
 * @returns true wenn User Zugriff hat, sonst false
 */
export async function hasDppAccess(dppId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!dpp) {
      return false
    }

    // User muss Mitglied der Organization sein
    return dpp.organization.memberships.length > 0
  } catch (error) {
    console.error("Error checking DPP access:", error)
    return false
  }
}

/**
 * Prüft DPP-Zugriff und leitet um wenn nicht autorisiert
 * 
 * @param dppId - ID des DPPs
 * @param redirectTo - Route für Redirect (default: /app/dashboard)
 */
export async function requireDppAccess(
  dppId: string,
  redirectTo: string = "/app/dashboard"
) {
  const hasAccess = await hasDppAccess(dppId)
  if (!hasAccess) {
    redirect(redirectTo)
  }
}

/**
 * Prüft ob User Zugriff auf eine Organization hat
 * 
 * @param organizationId - ID der Organization
 * @returns true wenn User Mitglied ist, sonst false
 */
export async function hasOrganizationAccess(organizationId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId
        }
      }
    })

    return !!membership
  } catch (error) {
    console.error("Error checking organization access:", error)
    return false
  }
}

/**
 * Prüft Organization-Zugriff und leitet um wenn nicht autorisiert
 * 
 * @param organizationId - ID der Organization
 * @param redirectTo - Route für Redirect (default: /app/dashboard)
 */
export async function requireOrganizationAccess(
  organizationId: string,
  redirectTo: string = "/app/dashboard"
) {
  const hasAccess = await hasOrganizationAccess(organizationId)
  if (!hasAccess) {
    redirect(redirectTo)
  }
}

