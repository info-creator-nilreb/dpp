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
 * Löschkonzept (gilt für Bilder, Dokumente, Videos):
 * - Nie veröffentlicht: Hard-Delete (DB + Storage) – Datensparsamkeit.
 * - In veröffentlichter Version genutzt: Soft-Delete – nur dpp_media-Eintrag löschen,
 *   Datei im Storage bleibt für Versionen-Historie.
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

    // Prüfen, ob diese Datei (storageUrl) in einer veröffentlichten Version vorkommt
    const usedInPublishedVersion = await prisma.dppVersionMedia.findFirst({
      where: {
        storageUrl: media.storageUrl,
        version: { dppId }
      }
    })

    // Nur aus Storage löschen, wenn keine Version die Datei nutzt
    if (!usedInPublishedVersion) {
      await deleteFile(media.storageUrl)
    }

    // Eintrag in dpp_media immer löschen (Entwurf bereinigen)
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

