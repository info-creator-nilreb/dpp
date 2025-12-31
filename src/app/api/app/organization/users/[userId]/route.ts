/**
 * DELETE /api/app/organization/users/[userId]
 * 
 * Entfernt einen User aus der Organisation (Soft-Remove)
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { removeUserFromOrganization } from "@/lib/phase1/user-management"
import { canRemoveUsers, getUserRole } from "@/lib/phase1/permissions"
import { logUserRemoved } from "@/lib/phase1/audit"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
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

    // Permission-Check: Nur ORG_ADMIN kann User entfernen
    if (!(await canRemoveUsers(session.user.id, user.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Entfernen von Usern" },
        { status: 403 }
      )
    }

    // Hole Rolle für Audit Log
    const actorRole = await getUserRole(session.user.id, user.organizationId)

    // Entferne User
    await removeUserFromOrganization(
      userId,
      user.organizationId,
      session.user.id
    )

    // Audit Log
    await logUserRemoved(
      user.organizationId,
      userId,
      session.user.id,
      actorRole || "ORG_ADMIN"
    )

    return NextResponse.json(
      { success: true, message: "User erfolgreich aus Organisation entfernt" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[ORGANIZATION_USERS_DELETE] Error:", error)
    
    if (error.message === "User does not belong to this organization") {
      return NextResponse.json(
        { error: "User gehört nicht zu dieser Organisation" },
        { status: 400 }
      )
    }

    if (error.message === "Cannot remove yourself") {
      return NextResponse.json(
        { error: "Sie können sich nicht selbst entfernen" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

