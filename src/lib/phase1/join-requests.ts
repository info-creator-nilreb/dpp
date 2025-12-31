/**
 * Phase 1: Join Request-System
 * 
 * User beantragt Beitritt zu Organisation
 */

import { prisma } from "@/lib/prisma"
import { Phase1Role, DEFAULT_ROLE } from "./roles"

/**
 * Erstellt einen Join Request
 */
export async function createJoinRequest(
  userId: string,
  organizationId: string,
  message?: string
): Promise<{ joinRequestId: string }> {
  // Prüfe ob bereits ein Request existiert
  const existing = await prisma.joinRequest.findFirst({
    where: {
      userId,
      organizationId,
      status: "pending",
    },
  })

  if (existing) {
    return { joinRequestId: existing.id }
  }

  const joinRequest = await prisma.joinRequest.create({
    data: {
      userId,
      organizationId,
      status: "pending",
      message,
    },
  })

  return { joinRequestId: joinRequest.id }
}

/**
 * Genehmigt einen Join Request
 * 
 * User wird Mitglied mit Default-Rolle (VIEWER)
 */
export async function approveJoinRequest(
  joinRequestId: string,
  reviewedById: string
): Promise<{ organizationId: string; userId: string } | null> {
  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id: joinRequestId },
  })

  if (!joinRequest || joinRequest.status !== "pending") {
    return null
  }

  return await prisma.$transaction(async (tx) => {
    // 1. User zur Organisation zuordnen
    await tx.user.update({
      where: { id: joinRequest.userId },
      data: {
        organizationId: joinRequest.organizationId,
        status: "active",
      },
    })

    // 2. Membership erstellen (Default-Rolle: VIEWER)
    await tx.membership.create({
      data: {
        userId: joinRequest.userId,
        organizationId: joinRequest.organizationId,
        role: DEFAULT_ROLE,
      },
    })

    // 3. Join Request als genehmigt markieren
    await tx.joinRequest.update({
      where: { id: joinRequestId },
      data: {
        status: "approved",
        reviewedById,
        reviewedAt: new Date(),
      },
    })

    return {
      organizationId: joinRequest.organizationId,
      userId: joinRequest.userId,
    }
  })
}

/**
 * Lehnt einen Join Request ab
 */
export async function rejectJoinRequest(
  joinRequestId: string,
  reviewedById: string
): Promise<void> {
  await prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: {
      status: "rejected",
      reviewedById,
      reviewedAt: new Date(),
    },
  })
}

/**
 * Holt alle Join Requests einer Organisation
 */
export async function getOrganizationJoinRequests(organizationId: string) {
  return await prisma.joinRequest.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
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
 * Prüft ob User bereits einen Join Request hat
 */
export async function hasPendingJoinRequest(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const joinRequest = await prisma.joinRequest.findFirst({
    where: {
      userId,
      organizationId,
      status: "pending",
    },
  })

  return joinRequest !== null
}

