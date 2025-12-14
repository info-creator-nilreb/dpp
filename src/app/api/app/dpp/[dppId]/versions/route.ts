export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireDppAccess } from "@/lib/dpp-access"

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
    await requireDppAccess(params.dppId)

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

    return NextResponse.json({
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        name: v.name,
        createdAt: v.createdAt,
        createdBy: {
          name: v.createdBy.name || v.createdBy.email,
          email: v.createdBy.email
        }
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

