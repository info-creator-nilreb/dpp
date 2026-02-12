export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { saveFile, isAllowedFileType, getMaxFileSize, deleteFile } from "@/lib/storage"
import { requireEditDPP, requireViewDPP } from "@/lib/api-permissions"
import { DPP_SECTIONS } from "@/lib/permissions"
import { scanFile } from "@/lib/virus-scanner"
import { logDppMediaAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-helpers"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { getOrganizationRole } from "@/lib/permissions"

/**
 * POST /api/app/dpp/[dppId]/media
 * 
 * Upload eines Mediums (Bild oder PDF) für einen DPP
 * - Prüft Berechtigung (User muss Mitglied der Organization sein)
 * - Validiert Dateityp und -größe
 * - Speichert Datei im Storage
 * - Speichert Metadaten in DB
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Berechtigung zum Bearbeiten (inkl. Medien-Upload)
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const blockId = formData.get("blockId") as string | null
    const fieldId = formData.get("fieldId") as string | null
    const fieldKey = formData.get("fieldKey") as string | null
    const role = formData.get("role") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      )
    }

    // Validierung: Dateityp
    if (!isAllowedFileType(file.type)) {
      return NextResponse.json(
        { error: "Dateityp nicht erlaubt. Erlaubt: Bilder (JPEG, PNG, GIF, WebP), PDFs und Videos (MP4, WebM, OGG)" },
        { status: 400 }
      )
    }

    // Validierung: Dateigröße (dynamisch basierend auf Dateityp)
    const maxSize = getMaxFileSize(file.type)
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Datei zu groß. Maximum: ${maxSize / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    // Datei in Buffer konvertieren
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Virus Scan (nur in Production, überspringbar in Development)
    try {
      await scanFile(buffer, file.name)
    } catch (scanError) {
      console.error("[Media Upload] Virus scan failed:", scanError)
      return NextResponse.json(
        { error: "Datei konnte nicht auf Viren geprüft werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support." },
        { status: 400 }
      )
    }

    // Datei im Storage speichern
    const storageUrl = await saveFile(buffer, file.name)

    // Metadaten in DB speichern (role = primary_product_image für erstes Produktbild in Basisdaten)
    const media = await prisma.dppMedia.create({
      data: {
        dppId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageUrl,
        role: role?.trim() || null,
        blockId: blockId || null,
        fieldId: fieldId || null,
        fieldKey: fieldKey || null
      }
    })

    return NextResponse.json(
      {
        message: "Medium erfolgreich hochgeladen",
        media: {
          id: media.id,
          fileName: media.fileName,
          fileType: media.fileType,
          fileSize: media.fileSize,
          storageUrl: media.storageUrl,
          uploadedAt: media.uploadedAt,
          sortOrder: media.sortOrder
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Media upload error:", error)
    const message =
      error?.message && typeof error.message === "string"
        ? error.message
        : "Ein Fehler ist aufgetreten"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/app/dpp/[dppId]/media
 * 
 * Holt alle Medien eines DPPs
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Berechtigung zum Ansehen
    const permissionError = await requireViewDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    // Hole alle Medien sortiert per Raw-SQL (sortOrder, dann uploadedAt) – unabhängig vom Prisma-Client
    const media = await prisma.$queryRaw<
      Array<{
        id: string
        dppId: string
        fileName: string
        fileType: string
        fileSize: number
        storageUrl: string
        uploadedAt: Date
        sortOrder: number
        role: string | null
        blockId: string | null
        fieldId: string | null
        fieldKey: string | null
      }>
    >`
      SELECT id, "dppId", "fileName", "fileType", "fileSize", "storageUrl", "uploadedAt", "sortOrder", role, "blockId", "fieldId", "fieldKey"
      FROM dpp_media
      WHERE "dppId" = ${dppId}
      ORDER BY "sortOrder" ASC, "uploadedAt" DESC
    `

    return NextResponse.json({ media }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching media:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/app/dpp/[dppId]/media
 *
 * Reihenfolge der Medien aktualisieren (z. B. für Hero = erstes Bild).
 * Body: { mediaIds: string[] } – IDs in der gewünschten Reihenfolge.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    const body = await request.json()
    const mediaIds = Array.isArray(body.mediaIds) ? body.mediaIds : []

    if (mediaIds.length === 0) {
      return NextResponse.json(
        { error: "mediaIds (Array) erforderlich" },
        { status: 400 }
      )
    }

    // Reihenfolge per Raw-SQL setzen (unabhängig vom generierten Prisma-Client)
    await prisma.$transaction(
      mediaIds.map((id: string, index: number) =>
        prisma.$executeRaw`
          UPDATE dpp_media SET "sortOrder" = ${index}
          WHERE id = ${id} AND "dppId" = ${dppId}
        `
      )
    )

    return NextResponse.json(
      { message: "Reihenfolge aktualisiert" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Media reorder error:", error)
    return NextResponse.json(
      { error: error?.message ?? "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/app/dpp/[dppId]/media?storageUrl=...
 *
 * Löscht ein Medium anhand der storageUrl (z.B. für FileField in Mehrwert-Blöcken, die nur URLs speichern).
 * Gleiche Löschlogik wie DELETE by mediaId: Hard-Delete (DB + Storage) nur wenn nie veröffentlicht.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const { searchParams } = new URL(request.url)
    const storageUrl = searchParams.get("storageUrl")

    if (!storageUrl || storageUrl.trim() === "") {
      return NextResponse.json(
        { error: "storageUrl Query-Parameter erforderlich" },
        { status: 400 }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    const media = await prisma.dppMedia.findFirst({
      where: { dppId, storageUrl: storageUrl.trim() }
    })

    if (!media) {
      return NextResponse.json(
        { error: "Medium nicht gefunden" },
        { status: 404 }
      )
    }

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

    const usedInPublishedVersion = await prisma.dppVersionMedia.findFirst({
      where: {
        storageUrl: media.storageUrl,
        version: { dppId }
      }
    })

    if (!usedInPublishedVersion) {
      await deleteFile(media.storageUrl)
    }

    await prisma.dppMedia.delete({
      where: { id: media.id }
    })

    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, dpp.organizationId)
    await logDppMediaAction(ACTION_TYPES.DELETE, media.id, dppId, {
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
    console.error("Media delete by URL error:", error)
    return NextResponse.json(
      { error: error?.message ?? "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/app/dpp/[dppId]/media?storageUrl=...
 *
 * Löscht ein Medium anhand der storageUrl (z.B. für FileField in Mehrwert-Blöcken, die nur URLs speichern).
 * Gleiche Löschlogik wie DELETE by mediaId: Hard-Delete (DB + Storage) nur wenn nie veröffentlicht.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const { searchParams } = new URL(request.url)
    const storageUrl = searchParams.get("storageUrl")

    if (!storageUrl || storageUrl.trim() === "") {
      return NextResponse.json(
        { error: "storageUrl Query-Parameter erforderlich" },
        { status: 400 }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    const media = await prisma.dppMedia.findFirst({
      where: { dppId, storageUrl: storageUrl.trim() }
    })

    if (!media) {
      return NextResponse.json(
        { error: "Medium nicht gefunden" },
        { status: 404 }
      )
    }

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

    const usedInPublishedVersion = await prisma.dppVersionMedia.findFirst({
      where: {
        storageUrl: media.storageUrl,
        version: { dppId }
      }
    })

    if (!usedInPublishedVersion) {
      await deleteFile(media.storageUrl)
    }

    await prisma.dppMedia.delete({
      where: { id: media.id }
    })

    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, dpp.organizationId)
    await logDppMediaAction(ACTION_TYPES.DELETE, media.id, dppId, {
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
    console.error("Media delete by URL error:", error)
    return NextResponse.json(
      { error: error?.message ?? "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

