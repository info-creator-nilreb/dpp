/**
 * Phase 1: Invitations API
 * 
 * GET /api/app/organization/invitations - Liste aller Einladungen
 * POST /api/app/organization/invitations - Neue Einladung erstellen
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  createInvitation,
  getOrganizationInvitations,
  hasPendingInvitation,
} from "@/lib/phase1/invitations"
import { canInviteUsers } from "@/lib/phase1/permissions"
import { getUserRole } from "@/lib/phase1/permissions"
import { logUserInvited } from "@/lib/phase1/audit"
import { sendInvitationEmail } from "@/lib/email"

/**
 * GET /api/app/organization/invitations
 * 
 * Holt alle Einladungen der Organisation
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

    const invitations = await getOrganizationInvitations(user.organizationId)

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error: any) {
    console.error("[INVITATIONS_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/app/organization/invitations
 * 
 * Erstellt eine neue Einladung
 * Body: { email: string, role: "ORG_ADMIN" | "EDITOR" | "VIEWER" }
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

    // Permission-Check: Nur ORG_ADMIN kann einladen
    if (!(await canInviteUsers(session.user.id, user.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Einladen von Usern" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role = "VIEWER" } = body

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob bereits eine Einladung existiert
    if (await hasPendingInvitation(email, user.organizationId)) {
      return NextResponse.json(
        { error: "Eine Einladung für diese E-Mail existiert bereits" },
        { status: 400 }
      )
    }

    // Prüfe ob User bereits Mitglied ist
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { organizationId: true },
    })

    if (existingUser?.organizationId === user.organizationId) {
      return NextResponse.json(
        { error: "User ist bereits Mitglied dieser Organisation" },
        { status: 400 }
      )
    }

    // Hole User-Rolle für Audit Log
    const actorRole = await getUserRole(session.user.id, user.organizationId)

    // Erstelle Einladung
    const { invitationId, token } = await createInvitation(
      email,
      user.organizationId,
      role,
      session.user.id
    )

    // Sende E-Mail
    try {
      await sendInvitationEmail(email, user.organizationId, token)
    } catch (emailError) {
      console.error("[INVITATIONS_POST] E-Mail-Versand fehlgeschlagen:", emailError)
      // Einladung bleibt bestehen, auch wenn E-Mail fehlschlägt
    }

    // Audit Log
    await logUserInvited(
      user.organizationId,
      session.user.id,
      actorRole || "ORG_ADMIN",
      email, // invitedUserId ist noch nicht bekannt
      role
    )

    return NextResponse.json(
      {
        success: true,
        invitationId,
        message: "Einladung erfolgreich erstellt und versendet",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[INVITATIONS_POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

