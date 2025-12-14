export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireDppAccess } from "@/lib/dpp-access"
import fs from "fs"
import path from "path"

/**
 * GET /api/app/dpp/[dppId]/versions/[versionNumber]/qr-code
 * 
 * Lädt QR-Code-Bild für Download
 */
export async function GET(
  request: Request,
  { params }: { params: { dppId: string; versionNumber: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Zugriff auf DPP
    await requireDppAccess(params.dppId)

    const versionNumber = parseInt(params.versionNumber, 10)
    if (isNaN(versionNumber)) {
      return NextResponse.json(
        { error: "Ungültige Versionsnummer" },
        { status: 400 }
      )
    }

    // Hole Version
    const version = await prisma.dppVersion.findUnique({
      where: {
        dppId_version: {
          dppId: params.dppId,
          version: versionNumber
        }
      },
      select: {
        qrCodeImageUrl: true
      }
    })

    if (!version || !version.qrCodeImageUrl) {
      return NextResponse.json(
        { error: "QR-Code nicht gefunden" },
        { status: 404 }
      )
    }

    // Lade QR-Code-Datei
    const filePath = path.join(process.cwd(), "public", version.qrCodeImageUrl)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "QR-Code-Datei nicht gefunden" },
        { status: 404 }
      )
    }

    const fileContent = fs.readFileSync(filePath)
    const fileName = `qrcode-dpp-${params.dppId}-v${versionNumber}.svg`

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    })
  } catch (error: any) {
    console.error("Error fetching QR code:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

