export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { prisma } from "@/lib/prisma"
import { sendInvitationEmail } from "@/lib/email"
import crypto from "crypto"
import { createAuditLog, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { createInvitation } from "@/lib/phase1/invitations"

/**
 * POST /api/super-admin/users
 * 
 * Create a new user
 * Requires: user update permission
 */
export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    if (!requirePermission(session, "user", "update")) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, organizationId, role } = body

    if (!firstName || !lastName || !email || !organizationId || !role) {
      return NextResponse.json(
        { error: "Alle Felder sind erforderlich" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["ORG_ADMIN", "EDITOR", "VIEWER"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Ungültige Rolle" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail existiert bereits" },
        { status: 400 }
      )
    }

    // Check organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Generate temporary password (user will set password via invite)
    const tempPassword = crypto.randomBytes(16).toString("hex")
    const hashedPassword = await require("bcryptjs").hash(tempPassword, 10)

    // Create user in invited state
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: hashedPassword, // Temporary, will be reset via invite
        status: "invited",
        organizationId,
        emailVerified: false,
      }
    })

    // Create membership with role
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId,
        role,
      }
    })

    // Create invitation and send email
    const invitation = await createInvitation(
      email,
      organizationId,
      role,
      session.id // Super Admin as inviter
    )

    await sendInvitationEmail(
      email,
      organizationId,
      invitation.token
    )

    // Audit log
    await createAuditLog({
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      organizationId,
      actionType: ACTION_TYPES.CREATE,
      entityType: ENTITY_TYPES.USER,
      entityId: user.id,
      source: SOURCES.UI,
      complianceRelevant: true,
      metadata: {
        superAdminAction: "super_admin.user.created",
        targetUserId: user.id,
        targetUserEmail: user.email,
        role,
        organizationId,
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_CREATE_USER] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

