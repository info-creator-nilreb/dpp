export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateQrCodeSvg } from "@/lib/qrcode"
import { getPublicUrl } from "@/lib/getPublicUrl"

/**
 * GET /api/app/dpp/[dppId]/versions/[versionNumber]/qr-code-preview
 * 
 * Generiert QR-Code on-demand für Anzeige (Preview)
 * Verwendet für <img src> in VersionQrCodeSection
 * Vercel-compatible: Kein Filesystem-Zugriff nötig
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string; versionNumber: string }> }
) {
  try {
    const { dppId, versionNumber: versionNumberParam } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Zugriff auf DPP
    const accessCheck = await prisma.dpp.findUnique({
      where: { id: dppId },
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

    const versionNumber = parseInt(versionNumberParam, 10)
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
          dppId,
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

    return new NextResponse(qrCodeSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600" // Cache für 1 Stunde
      }
    })
  } catch (error: any) {
    console.error("Error generating QR code preview:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

