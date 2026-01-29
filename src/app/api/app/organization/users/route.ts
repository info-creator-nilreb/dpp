/**
 * Phase 1: Organization Users API
 * 
 * GET /api/app/organization/users - Liste aller User der Organisation
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/organization/users
 * 
 * Holt alle User der Organisation
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Hole Organisation über Membership (EINZIGE QUELLE DER WAHRHEIT)
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
      orderBy: { createdAt: "asc" }, // Älteste Membership zuerst
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    const organizationId = membership.organizationId

    // Hole alle User mit Rollen über Memberships (EINZIGE QUELLE DER WAHRHEIT)
    // Jeder User sollte nur einmal erscheinen, mit der höchsten Rolle
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

    // Gruppiere nach User-ID und wähle die höchste Rolle
    const userMap = new Map<string, {
      user: typeof memberships[0]['user']
      role: string | null
    }>()

    const rolePriority: Record<string, number> = {
      ORG_ADMIN: 3,
      ORG_OWNER: 3, // Legacy-Rolle, gleiche Priorität wie ORG_ADMIN
      EDITOR: 2,
      VIEWER: 1,
    }

    for (const membership of memberships) {
      const userId = membership.user.id
      let currentRole = membership.role
      
      // Legacy-Rollen-Mapping: ORG_OWNER → ORG_ADMIN für Konsistenz
      if (currentRole === "ORG_OWNER") {
        currentRole = "ORG_ADMIN"
      }
      
      const currentPriority = rolePriority[currentRole] || 0

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: membership.user,
          role: currentRole,
        })
      } else {
        const existing = userMap.get(userId)!
        const existingPriority = rolePriority[existing.role || ''] || 0
        if (currentPriority > existingPriority) {
          existing.role = currentRole
        }
      }
    }

    // Konvertiere Map zu Array und füge isCurrentUser Flag hinzu
    const usersWithRoles = Array.from(userMap.values()).map(({ user, role }) => ({
      ...user,
      role: role || null, // Stelle sicher, dass null statt undefined verwendet wird
      isCurrentUser: user.id === session.user.id, // Flag für aktuellen Benutzer
    }))

    return NextResponse.json({ users: usersWithRoles }, { status: 200 })
  } catch (error: any) {
    console.error("[ORGANIZATION_USERS_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

