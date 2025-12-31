export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"
import { createAuditLog, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "@/lib/audit/audit-service"

/**
 * POST /api/super-admin/users/[id]/password-reset
 * 
 * Trigger password reset for a user
 * Requires: user update permission
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        organizationId: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = new Date()
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1) // 1 hour validity

    // Store token
    await prisma.user.update({
      where: { id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpires: resetTokenExpires,
      }
    })

    // Send email
    await sendPasswordResetEmail(
      user.email,
      user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name,
      resetToken
    )

    // Audit log
    await createAuditLog({
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      organizationId: user.organizationId || "",
      actionType: ACTION_TYPES.UPDATE,
      entityType: ENTITY_TYPES.USER,
      entityId: user.id,
      source: SOURCES.UI,
      complianceRelevant: true,
      metadata: {
        superAdminAction: "super_admin.user.password_reset_triggered",
        targetUserId: user.id,
        targetUserEmail: user.email,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Passwort-Reset-E-Mail wurde gesendet"
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_USER_PASSWORD_RESET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

