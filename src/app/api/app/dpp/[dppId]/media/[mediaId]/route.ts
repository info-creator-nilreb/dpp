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
 * PATCH /api/app/dpp/[dppId]/media/[mediaId]
 *
 * Aktualisiert Metadaten eines Mediums (z.B. displayName für Zertifikate)
 */
export async function PATCH(
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

    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    const media = await prisma.dppMedia.findUnique({
      where: { id: mediaId }
    })

    if (!media || media.dppId !== dppId) {
      return NextResponse.json(
        { error: "Medium nicht gefunden" },
        { status: 404 }
      )
    }

    let body: { displayName?: string | null }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Ungültiger JSON-Body" },
        { status: 400 }
      )
    }

    const { displayName } = body ?? {}
    const updateData: { displayName?: string | null } = {}
    if (typeof displayName === "string") {
      updateData.displayName = displayName.trim() || null
    } else if (displayName === null || displayName === undefined) {
      updateData.displayName = null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        message: "Nichts zu aktualisieren",
        media: { id: media.id, displayName: (media as any).displayName ?? null }
      })
    }

    // Raw SQL, da der Prisma Client das displayName-Feld ggf. noch nicht kennt (Cache)
    const newDisplayName = updateData.displayName ?? null
    await prisma.$executeRaw`
      UPDATE dpp_media SET "displayName" = ${newDisplayName}
      WHERE id = ${mediaId} AND "dppId" = ${dppId}
    `

    return NextResponse.json({
      message: "Medium aktualisiert",
      media: {
        id: media.id,
        displayName: newDisplayName
      }
    })
  } catch (error: any) {
    console.error("Error updating media:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

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

