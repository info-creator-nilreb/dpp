export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"

/**
 * DELETE /api/app/dpp/[dppId]/media/[mediaId]
 * 
 * Löscht ein Medium
 * - Prüft Berechtigung (User muss Mitglied der Organization sein)
 * - Löscht Datei aus Storage
 * - Löscht Metadaten aus DB
 */
export async function DELETE(
  request: Request,
  { params }: { params: { dppId: string; mediaId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { dppId, mediaId } = params

    // Prüfe ob DPP existiert und User Zugriff hat
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: { organization: { include: { memberships: true } } }
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Prüfe ob User Mitglied der Organization ist
    const hasAccess = dpp.organization.memberships.some(
      m => m.userId === session.user.id
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diesen DPP" },
        { status: 403 }
      )
    }

    // Hole Medium
    const media = await prisma.dppMedia.findUnique({
      where: { id: mediaId }
    })

    if (!media || media.dppId !== dppId) {
      return NextResponse.json(
        { error: "Medium nicht gefunden" },
        { status: 404 }
      )
    }

    // Lösche Datei aus Storage
    await deleteFile(media.storageUrl)

    // Lösche Metadaten aus DB
    await prisma.dppMedia.delete({
      where: { id: mediaId }
    })

    return NextResponse.json(
      { message: "Medium erfolgreich gelöscht" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting media:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

