/**
 * Phase 1: Organization Users API
 * 
 * GET /api/app/organization/users - Liste aller User der Organisation
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOrganizationUsers } from "@/lib/phase1/user-management"
import { getUserRole } from "@/lib/phase1/permissions"

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    // Hole alle User mit Rollen
    const users = await getOrganizationUsers(user.organizationId)
    
    // Füge Rollen hinzu
    const usersWithRoles = await Promise.all(
      users.map(async (u) => {
        const role = await getUserRole(u.id, user.organizationId)
        return {
          ...u,
          role,
        }
      })
    )

    return NextResponse.json({ users: usersWithRoles }, { status: 200 })
  } catch (error: any) {
    console.error("[ORGANIZATION_USERS_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

