export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"
import { requireEditDPP } from "@/lib/api-permissions"
import { logDppMediaAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-helpers"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { getOrganizationRole } from "@/lib/permissions"

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
  context: { params: Promise<{ dppId: string; mediaId: string }> }
) {
  try {
    const { dppId, mediaId } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

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

    // Hole DPP für Organization-ID
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      select: { organizationId: true }
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Lösche Datei aus Storage
    await deleteFile(media.storageUrl)

    // Lösche Metadaten aus DB
    await prisma.dppMedia.delete({
      where: { id: mediaId }
    })

    // Audit Log: DPP Media gelöscht
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, dpp.organizationId)
    
    await logDppMediaAction(ACTION_TYPES.DELETE, mediaId, dppId, {
      actorId: session.user.id,
      actorRole: role || undefined,
      organizationId: dpp.organizationId,
      source: SOURCES.UI,
      complianceRelevant: false,
      ipAddress,
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

