export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"
import { requireEditDPP } from "@/lib/api-permissions"

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

    // Prüfe Berechtigung zum Bearbeiten
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

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

