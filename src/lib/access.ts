import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

/**
 * Access-Control Helper-Funktionen
 * 
 * Zentrale Funktionen für Zugriffsprüfungen:
 * - Platform-Admin-Checks
 * - Organization-Membership-Checks
 */

/**
 * Prüft ob User Platform-Admin ist
 * 
 * @returns true wenn User Platform-Admin ist, sonst false
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.isPlatformAdmin === true
}

/**
 * Prüft ob User Mitglied einer Organization ist
 * 
 * @param organizationId - ID der Organization
 * @returns true wenn User Mitglied ist, sonst false
 */
export async function isOrganizationMember(organizationId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId
      }
    }
  })

  return !!membership
}

/**
 * Holt alle Organizations, in denen der User Mitglied ist
 * 
 * @returns Array von Organizations
 */
export async function getUserOrganizations() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        organization: true
      }
    })

    return memberships.map(m => m.organization)
  } catch (error) {
    // Fallback: Wenn Membership-Tabelle noch nicht existiert, leere Liste zurückgeben
    console.error("Error fetching memberships:", error)
    return []
  }
}

/**
 * Prüft Platform-Admin-Zugriff und leitet um wenn nicht autorisiert
 * 
 * @param redirectTo - Route für Redirect (default: /app/dashboard)
 */
export async function requirePlatformAdmin(redirectTo: string = "/app/dashboard") {
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    redirect(redirectTo)
  }
}

/**
 * Prüft Organization-Membership und leitet um wenn nicht autorisiert
 * 
 * @param organizationId - ID der Organization
 * @param redirectTo - Route für Redirect (default: /app/dashboard)
 */
export async function requireOrganizationMember(
  organizationId: string,
  redirectTo: string = "/app/dashboard"
) {
  const isMember = await isOrganizationMember(organizationId)
  if (!isMember) {
    redirect(redirectTo)
  }
}

