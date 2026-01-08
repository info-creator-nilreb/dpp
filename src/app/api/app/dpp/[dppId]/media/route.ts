export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { saveFile, isAllowedFileType, getMaxFileSize } from "@/lib/storage"
import { requireEditDPP, requireViewDPP } from "@/lib/api-permissions"
import { DPP_SECTIONS } from "@/lib/permissions"
import { scanFile } from "@/lib/virus-scanner"

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
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { dppId } = params

    // Prüfe Berechtigung zum Bearbeiten (inkl. Medien-Upload)
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const blockId = formData.get("blockId") as string | null
    const fieldId = formData.get("fieldId") as string | null

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

    // Metadaten in DB speichern
    const media = await prisma.dppMedia.create({
      data: {
        dppId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageUrl,
        blockId: blockId || null,
        fieldId: fieldId || null
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
          uploadedAt: media.uploadedAt
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Media upload error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
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
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { dppId } = params

    // Prüfe Berechtigung zum Ansehen
    const permissionError = await requireViewDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    // Hole alle Medien des DPPs
    const media = await prisma.dppMedia.findMany({
      where: { dppId },
      orderBy: { uploadedAt: "desc" }
    })

    return NextResponse.json({ media }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching media:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

