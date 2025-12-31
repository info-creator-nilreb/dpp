/**
 * Phase 1: Join Requests API
 * 
 * GET /api/app/organization/join-requests - Liste aller Join Requests
 * POST /api/app/organization/join-requests - Neuen Join Request erstellen
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  createJoinRequest,
  getOrganizationJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  hasPendingJoinRequest,
} from "@/lib/phase1/join-requests"
import { canManageJoinRequests, getUserRole } from "@/lib/phase1/permissions"
import {
  logJoinRequestCreated,
  logJoinRequestApproved,
  logJoinRequestRejected,
} from "@/lib/phase1/audit"
import { notifyOrgAdmins, createNotification } from "@/lib/phase1/notifications"

/**
 * GET /api/app/organization/join-requests
 * 
 * Holt alle Join Requests der Organisation
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

    // Permission-Check: Nur ORG_ADMIN kann Join Requests sehen
    if (!(await canManageJoinRequests(session.user.id, user.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    const joinRequests = await getOrganizationJoinRequests(user.organizationId)

    return NextResponse.json({ joinRequests }, { status: 200 })
  } catch (error: any) {
    console.error("[JOIN_REQUESTS_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/app/organization/join-requests
 * 
 * Erstellt einen neuen Join Request
 * Body: { organizationId: string, message?: string }
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

    const body = await request.json()
    const { organizationId, message } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId ist erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob Organisation existiert
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Prüfe ob User bereits Mitglied ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (user?.organizationId === organizationId) {
      return NextResponse.json(
        { error: "Sie sind bereits Mitglied dieser Organisation" },
        { status: 400 }
      )
    }

    // Prüfe ob bereits ein Join Request existiert
    if (await hasPendingJoinRequest(session.user.id, organizationId)) {
      return NextResponse.json(
        { error: "Eine Beitrittsanfrage existiert bereits" },
        { status: 400 }
      )
    }

    // Erstelle Join Request
    const { joinRequestId } = await createJoinRequest(
      session.user.id,
      organizationId,
      message
    )

    // Audit Log
    await logJoinRequestCreated(organizationId, session.user.id)

    // Notify ORG_ADMINs
    await notifyOrgAdmins(
      organizationId,
      "join_request",
      "join_request",
      joinRequestId
    )

    return NextResponse.json(
      {
        success: true,
        joinRequestId,
        message: "Beitrittsanfrage erfolgreich erstellt",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[JOIN_REQUESTS_POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

