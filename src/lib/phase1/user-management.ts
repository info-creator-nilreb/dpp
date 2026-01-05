/**
 * Phase 1: User-Management
 * 
 * Funktionen zum Verwalten von Usern in einer Organisation
 */

import { prisma } from "@/lib/prisma"
import { createNotification, notifyOrgAdmins } from "./notifications"

/**
 * Entfernt einen User aus einer Organisation (Soft-Remove)
 * 
 * Regel: Nur ORG_ADMIN kann User entfernen
 * - Zugriff wird sofort entzogen
 * - User bleibt auditierbar
 */
export async function removeUserFromOrganization(
  userId: string,
  organizationId: string,
  removedById: string
): Promise<void> {
  // Prüfe ob User zur Organisation gehört (über Membership)
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      user: {
        select: { email: true },
      },
    },
  })

  if (!membership) {
    throw new Error("User does not belong to this organization")
  }

  // Prüfe ob User sich selbst entfernt (nicht erlaubt)
  if (userId === removedById) {
    throw new Error("Cannot remove yourself")
  }

  await prisma.$transaction(async (tx) => {
    // 1. Membership löschen (EINZIGE QUELLE DER WAHRHEIT)
    await tx.membership.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    })

    // 2. Prüfe ob User noch andere Memberships hat
    const otherMemberships = await tx.membership.findFirst({
      where: { userId },
    })

    // 3. User-Status auf suspended setzen wenn keine anderen Memberships existieren
    // Aktualisiere Cache-Feld organizationId
    if (!otherMemberships) {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "suspended",
          organizationId: null, // Cache-Feld zurücksetzen
        },
      })
    } else {
      // User hat noch andere Memberships - aktualisiere Cache-Feld
      const firstMembership = await tx.membership.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      })
      if (firstMembership) {
        await tx.user.update({
          where: { id: userId },
          data: {
            organizationId: firstMembership.organizationId, // Cache aktualisieren
          },
        })
      }
    }

    // 3. Notification für entfernten User erstellen
    await createNotification(
      userId,
      "user_removed",
      "organization",
      organizationId
    )
  })
}

/**
 * Aktualisiert User-Profil
 * 
 * User kann nur eigene Daten bearbeiten
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string
    lastName?: string
    jobTitle?: string
    phone?: string
    preferredLanguage?: string
    timeZone?: string
  }
): Promise<void> {
  // Aktualisiere nur erlaubte Felder
  const updateData: any = {}

  if (data.firstName !== undefined) updateData.firstName = data.firstName
  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName
    // Legacy-Feld aktualisieren
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      })
      if (user) {
        updateData.name = `${data.firstName ?? user.firstName} ${data.lastName ?? user.lastName}`
      }
    }
  }
  if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.preferredLanguage !== undefined) updateData.preferredLanguage = data.preferredLanguage
  if (data.timeZone !== undefined) updateData.timeZone = data.timeZone

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })
}

/**
 * Aktualisiert lastLoginAt
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
    },
  })
}

/**
 * Holt User mit Organisation
 */
export async function getUserWithOrganization(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      memberships: {
        where: {
          organization: {
            id: {
              not: undefined,
            },
          },
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Holt alle User einer Organisation
 * 
 * WICHTIG: Verwendet Membership als Quelle der Wahrheit, nicht User.organizationId
 */
export async function getOrganizationUsers(organizationId: string) {
  const memberships = await prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          lastLoginAt: true,
          jobTitle: true,
          phone: true,
        },
      },
    },
    orderBy: [
      { user: { lastName: "asc" } },
      { user: { firstName: "asc" } },
    ],
  })

  // Extrahiere User aus Memberships
  return memberships.map((membership) => membership.user)
}

