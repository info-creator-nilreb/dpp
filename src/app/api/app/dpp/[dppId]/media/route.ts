export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { saveFile, isAllowedFileType, MAX_FILE_SIZE } from "@/lib/storage"

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

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      )
    }

    // Validierung: Dateityp
    if (!isAllowedFileType(file.type)) {
      return NextResponse.json(
        { error: "Dateityp nicht erlaubt. Erlaubt: Bilder (JPEG, PNG, GIF, WebP) und PDFs" },
        { status: 400 }
      )
    }

    // Validierung: Dateigröße
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Datei zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    // Datei in Buffer konvertieren
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Datei im Storage speichern
    const storageUrl = await saveFile(buffer, file.name)

    // Metadaten in DB speichern
    const media = await prisma.dppMedia.create({
      data: {
        dppId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageUrl
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

