export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateQrCodeSvg } from "@/lib/qrcode"
import { getPublicUrl } from "@/lib/getPublicUrl"

/**
 * GET /api/app/dpp/[dppId]/versions/[versionNumber]/qr-code
 * 
 * Generiert QR-Code on-demand für Download
 * Vercel-compatible: Kein Filesystem-Zugriff nötig
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

    // Generiere absolute URL zur Laufzeit (unterstützt auch bestehende absolute URLs)
    const absolutePublicUrl = getPublicUrl(version.publicUrl)
    
    if (!absolutePublicUrl) {
      return NextResponse.json(
        { error: "Öffentliche URL konnte nicht generiert werden" },
        { status: 500 }
      )
    }

    // Generiere QR-Code on-demand (SVG) mit absoluter URL
    const qrCodeSvg = await generateQrCodeSvg(absolutePublicUrl)
    const fileName = `qrcode-dpp-${params.dppId}-v${versionNumber}.svg`

    return new NextResponse(qrCodeSvg, {
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
