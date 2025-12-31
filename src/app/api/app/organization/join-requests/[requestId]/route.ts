/**
 * PUT /api/app/organization/join-requests/[requestId]
 * 
 * Genehmigt oder lehnt einen Join Request ab
 * Body: { action: "approve" | "reject" }
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  approveJoinRequest,
  rejectJoinRequest,
} from "@/lib/phase1/join-requests"
import { canManageJoinRequests, getUserRole } from "@/lib/phase1/permissions"
import {
  logJoinRequestApproved,
  logJoinRequestRejected,
} from "@/lib/phase1/audit"
import { createNotification } from "@/lib/phase1/notifications"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action muss 'approve' oder 'reject' sein" },
        { status: 400 }
      )
    }

    // Hole Join Request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      select: { organizationId: true, userId: true },
    })

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join Request nicht gefunden" },
        { status: 404 }
      )
    }

    // Permission-Check
    if (!(await canManageJoinRequests(session.user.id, joinRequest.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    // Hole User-Rolle für Audit Log
    const reviewerRole = await getUserRole(session.user.id, joinRequest.organizationId)

    if (action === "approve") {
      // Genehmige Join Request
      const result = await approveJoinRequest(requestId, session.user.id)

      if (!result) {
        return NextResponse.json(
          { error: "Join Request konnte nicht genehmigt werden" },
          { status: 400 }
        )
      }

      // Audit Log
      await logJoinRequestApproved(
        joinRequest.organizationId,
        result.userId,
        session.user.id,
        reviewerRole || "ORG_ADMIN"
      )

      // Notification für User
      await createNotification(
        result.userId,
        "invitation_accepted",
        "organization",
        joinRequest.organizationId
      )

      return NextResponse.json(
        {
          success: true,
          message: "Join Request genehmigt",
          userId: result.userId,
        },
        { status: 200 }
      )
    } else {
      // Lehne Join Request ab
      await rejectJoinRequest(requestId, session.user.id)

      // Audit Log
      await logJoinRequestRejected(
        joinRequest.organizationId,
        joinRequest.userId,
        session.user.id,
        reviewerRole || "ORG_ADMIN"
      )

      return NextResponse.json(
        {
          success: true,
          message: "Join Request abgelehnt",
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error("[JOIN_REQUESTS_PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

