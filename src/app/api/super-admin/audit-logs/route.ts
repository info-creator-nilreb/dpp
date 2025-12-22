/**
 * SUPER ADMIN AUDIT LOGS API
 * 
 * Read-only access to audit logs
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: List audit logs
export async function GET(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("audit", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")
    const action = searchParams.get("action")
    const adminId = searchParams.get("adminId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (action) where.action = { contains: action, mode: "insensitive" }
    if (adminId) where.superAdminId = adminId
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          superAdmin: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_AUDIT] GET error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Audit Logs" },
      { status: 500 }
    )
  }
}

