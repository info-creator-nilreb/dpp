export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"

/**
 * DELETE /api/app/dpp/[dppId]/supplier-invites/[inviteId]
 *
 * Entfernt eine Supplier-Einladung (nur pending).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dppId: string; inviteId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireEditDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const invite = await prisma.dppSupplierInvite.findFirst({
      where: {
        id: resolvedParams.inviteId,
        dppId: resolvedParams.dppId,
      },
    })

    if (!invite) {
      return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 })
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Nur ausstehende Einladungen können entfernt werden" },
        { status: 400 }
      )
    }

    await prisma.dppSupplierInvite.delete({
      where: { id: invite.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Error deleting supplier invite:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
