export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP } from "@/lib/api-permissions"

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

    // Prüfe Berechtigung zum Ansehen
    const permissionError = await requireViewDPP(params.dppId, session.user.id)
    if (permissionError) {
      console.error("Permission check failed for versions:", params.dppId, session.user.id)
      return permissionError
    }

    console.log("Loading versions for DPP:", params.dppId)
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
    console.log("Versions loaded:", versions.length)

    // Also get DPP info for context
    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      select: {
        id: true,
        name: true,
        status: true
      }
    })
    console.log("DPP loaded:", dpp ? "found" : "not found")

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
        hasQrCode: !!v.publicUrl // QR-Code verfügbar wenn publicUrl vorhanden (on-demand generiert)
      }))
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching versions:", error)
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

