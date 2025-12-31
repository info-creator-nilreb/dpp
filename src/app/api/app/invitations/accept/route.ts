/**
 * POST /api/app/invitations/accept
 * 
 * Akzeptiert eine Einladung
 * Body: { token: string }
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { acceptInvitation } from "@/lib/phase1/invitations"
import { logInvitationAccepted } from "@/lib/phase1/audit"

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
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Token ist erforderlich" },
        { status: 400 }
      )
    }

    // Akzeptiere Einladung
    const result = await acceptInvitation(token, session.user.id)

    if (!result) {
      return NextResponse.json(
        { error: "Einladung nicht gefunden, abgelaufen oder bereits akzeptiert" },
        { status: 400 }
      )
    }

    // Audit Log
    await logInvitationAccepted(
      result.organizationId,
      session.user.id,
      result.role
    )

    return NextResponse.json(
      {
        success: true,
        organizationId: result.organizationId,
        role: result.role,
        message: "Einladung erfolgreich akzeptiert",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[INVITATIONS_ACCEPT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

