export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { saveFile } from "@/lib/storage"
import { scanFile } from "@/lib/virus-scanner"
import { canEditOrganization } from "@/lib/phase1/permissions"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"

const LOGO_MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]

/**
 * POST /api/app/organization/logo
 *
 * Logo-Upload für Organisations-Standard-Styling (Premium/cms_styling).
 * Speichert die Datei im Storage und gibt die URL zurück.
 * Der Client speichert die URL über PUT /api/app/organization/company-details (defaultStyling.logo).
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    const canEdit = await canEditOrganization(session.user.id, user.organizationId)
    if (!canEdit) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Bearbeiten der Organisation" },
        { status: 403 }
      )
    }

    const context: CapabilityContext = {
      organizationId: user.organizationId,
      userId: session.user.id,
    }
    const hasCmsStyling = await hasFeature("cms_styling", context)
    if (!hasCmsStyling) {
      return NextResponse.json(
        { error: "Styling-Feature für diese Organisation nicht verfügbar" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      )
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Nur Bilder erlaubt (JPEG, PNG, GIF, WebP)" },
        { status: 400 }
      )
    }

    if (file.size > LOGO_MAX_BYTES) {
      return NextResponse.json(
        { error: "Datei zu groß. Maximum: 2 MB" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      await scanFile(buffer, file.name)
    } catch (scanError) {
      console.error("[Organization logo] Virus scan failed:", scanError)
      return NextResponse.json(
        { error: "Datei konnte nicht auf Viren geprüft werden. Bitte versuchen Sie es erneut." },
        { status: 400 }
      )
    }

    const storageUrl = await saveFile(buffer, file.name)

    return NextResponse.json(
      {
        message: "Logo erfolgreich hochgeladen",
        media: {
          storageUrl,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("[Organization logo] Error:", error)
    const message =
      error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
