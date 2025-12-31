/**
 * Phase 1: Invitation-System
 * 
 * Organisation lädt User per E-Mail ein
 */

import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { Phase1Role, DEFAULT_ROLE } from "./roles"

/**
 * Erstellt eine Einladung
 */
export async function createInvitation(
  email: string,
  organizationId: string,
  role: Phase1Role,
  invitedById: string
): Promise<{ invitationId: string; token: string }> {
  // Generiere eindeutigen Token
  const token = randomBytes(32).toString("hex")
  
  // Token ist 7 Tage gültig
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invitation = await prisma.invitation.create({
    data: {
      email: email.toLowerCase().trim(),
      organizationId,
      role,
      status: "pending",
      token,
      expiresAt,
      invitedById,
    },
  })

  return {
    invitationId: invitation.id,
    token: invitation.token,
  }
}

/**
 * Akzeptiert eine Einladung
 * 
 * Wird aufgerufen, wenn User sich registriert oder einloggt
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ organizationId: string; role: Phase1Role } | null> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  })

  if (!invitation) {
    return null
  }

  // Prüfe ob Einladung noch gültig ist
  if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
    return null
  }

  // Prüfe ob E-Mail übereinstimmt
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return null
  }

  return await prisma.$transaction(async (tx) => {
    // 1. User zur Organisation zuordnen
    await tx.user.update({
      where: { id: userId },
      data: {
        organizationId: invitation.organizationId,
        status: "active",
      },
    })

    // 2. Membership erstellen
    await tx.membership.create({
      data: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    })

    // 3. Einladung als akzeptiert markieren
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
      },
    })

    return {
      organizationId: invitation.organizationId,
      role: invitation.role as Phase1Role,
    }
  })
}

/**
 * Holt alle Einladungen einer Organisation
 */
export async function getOrganizationInvitations(organizationId: string) {
  return await prisma.invitation.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * Prüft ob eine Einladung für eine E-Mail existiert
 */
export async function hasPendingInvitation(
  email: string,
  organizationId: string
): Promise<boolean> {
  const invitation = await prisma.invitation.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      organizationId,
      status: "pending",
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  return invitation !== null
}

/**
 * Löscht eine Einladung (z.B. wenn abgelehnt)
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  await prisma.invitation.delete({
    where: { id: invitationId },
  })
}

