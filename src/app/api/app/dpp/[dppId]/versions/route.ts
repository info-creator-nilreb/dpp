export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/dpp/[dppId]/versions
 * 
 * Holt alle veröffentlichten Versionen eines DPPs
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

    // Hole alle Versionen (absteigend nach Versionsnummer)
    const versions = await prisma.dppVersion.findMany({
      where: { dppId: params.dppId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        version: "desc"
      }
    })

    // Also get DPP info for context
    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      select: {
        id: true,
        name: true,
        status: true
      }
    })

    return NextResponse.json({
      dpp: dpp ? {
        id: dpp.id,
        name: dpp.name,
        status: dpp.status
      } : null,
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        name: v.name,
        createdAt: v.createdAt.toISOString(),
        createdBy: {
          name: v.createdBy.name || v.createdBy.email,
          email: v.createdBy.email
        },
        hasQrCode: !!v.qrCodeImageUrl
      }))
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching versions:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

