export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getUserRole, isOrgAdmin } from "@/lib/phase1/permissions"

/**
 * GET /api/app/organization/access
 * 
 * Prüft Zugriffsrechte des aktuellen Users für Organisationsverwaltung
 */
export async function GET(request: Request) {
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

    const role = await getUserRole(session.user.id, user.organizationId)
    const canManage = await isOrgAdmin(session.user.id, user.organizationId)

    return NextResponse.json({
      canManage,
      role,
    }, { status: 200 })
  } catch (error: any) {
    console.error("[ORGANIZATION_ACCESS_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

