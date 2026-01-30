/**
 * GET /api/auth/invitation?token=xxx
 *
 * Gibt die Einladungsdetails für die Signup-Seite zurück.
 * Öffentlich – nur Organisationsname und E-Mail für UX.
 */
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token fehlt" },
        { status: 400 }
      )
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { name: true },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Einladung nicht gefunden" },
        { status: 404 }
      )
    }

    if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Einladung ungültig oder abgelaufen" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      organizationName: invitation.organization?.name || "Organisation",
      email: invitation.email,
    })
  } catch (error) {
    console.error("[INVITATION_GET] Error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
