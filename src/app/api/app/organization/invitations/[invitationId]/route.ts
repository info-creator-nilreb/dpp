/**
 * DELETE /api/app/organization/invitations/[invitationId]
 * 
 * Löscht eine Einladung
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { deleteInvitation } from "@/lib/phase1/invitations"
import { canInviteUsers } from "@/lib/phase1/permissions"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Hole Einladung
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { organizationId: true },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Einladung nicht gefunden" },
        { status: 404 }
      )
    }

    // Permission-Check
    if (!(await canInviteUsers(session.user.id, invitation.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    // Lösche Einladung
    await deleteInvitation(invitationId)

    return NextResponse.json(
      { success: true, message: "Einladung gelöscht" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[INVITATIONS_DELETE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

