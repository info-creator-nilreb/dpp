export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { prisma } from "@/lib/prisma"
import { createAuditLog, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "@/lib/audit/audit-service"

/**
 * POST /api/super-admin/users/[id]/suspend
 * 
 * Suspend a user
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
        status: true,
        organizationId: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      )
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Benutzer ist bereits gesperrt" },
        { status: 400 }
      )
    }

    // Suspend user
    await prisma.user.update({
      where: { id },
      data: {
        status: "suspended"
      }
    })

    // Audit log
    await createAuditLog({
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      organizationId: user.organizationId || "",
      actionType: ACTION_TYPES.UPDATE,
      entityType: ENTITY_TYPES.USER,
      entityId: user.id,
      oldValue: { status: user.status },
      newValue: { status: "suspended" },
      source: SOURCES.UI,
      complianceRelevant: true,
      metadata: {
        superAdminAction: "super_admin.user.suspended",
        targetUserId: user.id,
        targetUserEmail: user.email,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Benutzer wurde gesperrt"
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_USER_SUSPEND] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

