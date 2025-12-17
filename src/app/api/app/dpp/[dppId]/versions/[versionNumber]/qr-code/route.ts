export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
<<<<<<< HEAD
import { generateQrCodeSvg } from "@/lib/qrcode"
=======
>>>>>>> 3ab206b54c871eaaaa4130317bf03f948965e9fc

/**
 * GET /api/app/dpp/[dppId]/versions/[versionNumber]/qr-code
 * 
<<<<<<< HEAD
 * Generiert QR-Code on-demand für Download
 * Vercel-compatible: Kein Filesystem-Zugriff nötig
=======
 * Lädt QR-Code-Bild für Download
 * QR-Code wird als Base64 Data-URL in der DB gespeichert
>>>>>>> 3ab206b54c871eaaaa4130317bf03f948965e9fc
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

    // Hole Version mit publicUrl
    const version = await prisma.dppVersion.findUnique({
      where: {
        dppId_version: {
          dppId: params.dppId,
          version: versionNumber
        }
      },
      select: {
        publicUrl: true
      }
    })

    if (!version || !version.publicUrl) {
      return NextResponse.json(
        { error: "Version oder öffentliche URL nicht gefunden" },
        { status: 404 }
      )
    }

<<<<<<< HEAD
    // Generiere QR-Code on-demand (SVG)
    const qrCodeSvg = await generateQrCodeSvg(version.publicUrl)
    const fileName = `qrcode-dpp-${params.dppId}-v${versionNumber}.svg`

    return new NextResponse(qrCodeSvg, {
=======
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
>>>>>>> 3ab206b54c871eaaaa4130317bf03f948965e9fc
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    })
  } catch (error: any) {
    console.error("Error generating QR code:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

