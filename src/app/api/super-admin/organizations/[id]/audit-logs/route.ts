export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/super-admin/organizations/[id]/audit-logs
 * 
 * Get audit logs scoped to a specific organization
 * Shows all logs where organizationId matches
 * Requires: audit read permission
 */
export async function GET(
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

    if (!requirePermission(session, "audit", "read")) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const actionType = searchParams.get("actionType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build where clause
    const where: any = {
      organizationId: id
    }

    if (actionType) {
      where.actionType = actionType
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    // Get audit logs
    const logs = await prisma.platformAuditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100, // Limit to 100 most recent
      select: {
        id: true,
        actionType: true,
        entityType: true,
        entityId: true,
        timestamp: true,
        metadata: true,
        oldValue: true,
        newValue: true,
        actorId: true,
        actorRole: true,
        organizationId: true,
      }
    })

    return NextResponse.json({
      logs
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORGANIZATION_AUDIT_LOGS] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

