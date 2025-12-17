export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/dpp/[dppId]/versions/[versionNumber]/qr-code
 * 
 * Lädt QR-Code-Bild für Download
 * QR-Code wird als Base64 Data-URL in der DB gespeichert
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
    const accessCheck = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!accessCheck || accessCheck.organization.memberships.length === 0) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diesen DPP" },
        { status: 403 }
      )
    }

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

    // qrCodeImageUrl ist jetzt eine Base64 Data-URL (data:image/svg+xml;base64,...)
    // Extrahiere Base64-Daten und konvertiere zu SVG
    let svgContent: string
    if (version.qrCodeImageUrl.startsWith("data:image/svg+xml;base64,")) {
      // Base64 Data-URL: Extrahiere Base64-String und dekodiere
      const base64Data = version.qrCodeImageUrl.split(",")[1]
      svgContent = Buffer.from(base64Data, "base64").toString("utf-8")
    } else if (version.qrCodeImageUrl.startsWith("data:image/svg+xml,")) {
      // URL-encoded Data-URL (fallback)
      const encodedData = version.qrCodeImageUrl.split(",")[1]
      svgContent = decodeURIComponent(encodedData)
    } else {
      // Fallback: Versuche als direkten SVG-String zu behandeln
      svgContent = version.qrCodeImageUrl
    }

    const fileName = `qrcode-dpp-${params.dppId}-v${versionNumber}.svg`

    return new NextResponse(svgContent, {
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

