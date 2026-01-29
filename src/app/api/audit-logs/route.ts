/**
 * GET /api/audit-logs
 * 
 * Retrieves audit logs with filtering, pagination, and role-based access control
 * 
 * Query Parameters:
 * - organizationId?: string
 * - dppId?: string
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 * - entityType?: string
 * - actionType?: string
 * - actorId?: string
 * - source?: string (UI | API | AI | SYSTEM)
 * - complianceOnly?: boolean (default: false)
 * - includeAIEvents?: boolean (default: true)
 * - page?: number (default: 1)
 * - limit?: number (default: 50, max: 200)
 * - export?: "csv" | "json"
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { buildAuditLogWhereClause, canAccessAuditLogs, canSeeIpAddresses } from "@/lib/audit/audit-access"
import { isSuperAdmin } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    // Check both regular auth and super admin auth
    const session = await auth()
    const { getSuperAdminSession } = await import("@/lib/super-admin-auth")
    const superAdminSession = await getSuperAdminSession()

    // Super Admin has full access
    const isSuperAdminUser = !!superAdminSession
    const userId = isSuperAdminUser ? `super-admin-${superAdminSession!.id}` : session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId") || undefined
    const dppId = searchParams.get("dppId") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const entityType = searchParams.get("entityType") || undefined
    const actionType = searchParams.get("actionType") || undefined
    const actorId = searchParams.get("actorId") || undefined
    const source = searchParams.get("source") || undefined
    const complianceOnly = searchParams.get("complianceOnly") === "true"
    const includeAIEvents = searchParams.get("includeAIEvents") !== "false"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")))
    const exportFormat = searchParams.get("export") as "csv" | "json" | null

    // Super Admins always have access
    if (!isSuperAdminUser) {
      const hasAccess = await canAccessAuditLogs(userId!, organizationId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Kein Zugriff auf Audit Logs" },
          { status: 403 }
        )
      }
    }

    // Build where clause based on role
    let baseWhere: any
    try {
      baseWhere = await buildAuditLogWhereClause({
        userId: userId!,
        organizationId,
        dppId,
        includeSystemEvents: isSuperAdminUser || (userId && !userId.startsWith("super-admin-") ? await isSuperAdmin(userId) : false),
        includeAIEvents,
      })
    } catch (error: any) {
      console.error("Error building where clause:", error)
      throw new Error(`Fehler beim Erstellen der Filter: ${error.message}`)
    }

    // Add additional filters
    const where: any = {
      ...baseWhere,
    }

    // Date range filter - merge with existing timestamp filter if any
    if (startDate || endDate) {
      if (!where.timestamp || typeof where.timestamp !== 'object') {
        where.timestamp = {}
      }
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    // Entity type filter
    if (entityType) {
      where.entityType = entityType
    }

    // Action type filter
    if (actionType) {
      where.actionType = actionType
    }

    // Actor filter
    if (actorId) {
      where.actorId = actorId
    }

    // Source filter
    if (source) {
      where.source = source
    }

    // Compliance-only filter
    if (complianceOnly) {
      where.complianceRelevant = true
    }

    // Check if user can see IP addresses (Super Admins always can)
    const canSeeIp = isSuperAdminUser || await canSeeIpAddresses(userId!)

    // Export mode
    if (exportFormat === "csv" || exportFormat === "json") {
      const logs = await prisma.platformAuditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (exportFormat === "csv") {
        const csv = convertToCSV(logs, canSeeIp)
        const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        })
      } else {
        const json = JSON.stringify(
          logs.map((log) => sanitizeLogForExport(log, canSeeIp)),
          null,
          2
        )
        const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.json`
        return new NextResponse(json, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        })
      }
    }

    // Pagination mode
    const skip = (page - 1) * limit


    let logs: any[]
    let total: number

    try {
      // Sequenzielles Laden statt Promise.all, um Connection Pool Overflow zu vermeiden
      // In Production kann paralleles Laden zu "MaxClientsInSessionMode" Fehlern führen
      logs = await prisma.platformAuditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
      
      total = await prisma.platformAuditLog.count({ where })
    } catch (dbError: any) {
      // Connection Pool Overflow oder andere DB-Fehler abfangen
      if (
        dbError?.message?.includes("MaxClientsInSessionMode") ||
        dbError?.message?.includes("max clients reached") ||
        dbError?.code === "P1001"
      ) {
        // Bei Connection Pool Overflow: Leere Daten zurückgeben statt Fehler zu werfen
        return NextResponse.json({
          logs: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          error: "Datenbankverbindung überlastet. Bitte versuchen Sie es später erneut.",
        }, { status: 503 })
      }
      throw new Error(`Datenbankfehler beim Laden der Audit Logs: ${dbError.message}`)
    }

    return NextResponse.json({
      logs: logs.map((log) => sanitizeLog(log, canSeeIp)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    // Connection Pool Overflow oder andere DB-Fehler abfangen
    if (
      error?.message?.includes("MaxClientsInSessionMode") ||
      error?.message?.includes("max clients reached") ||
      error?.code === "P1001"
    ) {
      return NextResponse.json({
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
        error: "Datenbankverbindung überlastet. Bitte versuchen Sie es später erneut.",
      }, { status: 503 })
    }
    
    // Andere Fehler
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Ein Fehler ist aufgetreten beim Laden der Audit Logs"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: error.code || undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Sanitize log for API response (mask IP if needed)
 */
function sanitizeLog(log: any, canSeeIp: boolean) {
  const sanitized = {
    ...log,
    oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
    newValue: log.newValue ? JSON.parse(log.newValue) : null,
    aiInputSources: log.aiInputSources ? JSON.parse(log.aiInputSources) : null,
  }

  if (!canSeeIp && sanitized.ipAddress) {
    sanitized.ipAddress = maskIpAddress(sanitized.ipAddress)
  }

  return sanitized
}

/**
 * Sanitize log for export
 */
function sanitizeLogForExport(log: any, canSeeIp: boolean) {
  const sanitized = sanitizeLog(log, canSeeIp)
  // Remove internal metadata that shouldn't be exported
  delete sanitized.metadata?.internal
  return sanitized
}

/**
 * Mask IP address
 */
function maskIpAddress(ip: string): string {
  const parts = ip.split(".")
  if (parts.length === 4) {
    return `${parts[0]}.xxx.xxx.xxx`
  }
  return "xxx.xxx.xxx.xxx"
}

/**
 * Convert logs to CSV
 */
function convertToCSV(logs: any[], canSeeIp: boolean): string {
  const headers = [
    "Timestamp",
    "Actor",
    "Role",
    "Organization",
    "Action",
    "Entity Type",
    "Entity ID",
    "Field",
    "Source",
    "Compliance Relevant",
    "IP Address",
    "AI Model",
    "AI Confidence",
    "Human in Loop",
  ]

  const rows = logs.map((log) => {
    const actorName = log.actor?.name || log.actor?.email || log.actorId || "SYSTEM"
    const orgName = log.organization?.name || "-"
    const ip = canSeeIp ? (log.ipAddress || "-") : (log.ipAddress ? maskIpAddress(log.ipAddress) : "-")

    return [
      log.timestamp.toISOString(),
      actorName,
      log.actorRole || "-",
      orgName,
      log.actionType,
      log.entityType,
      log.entityId || "-",
      log.fieldName || "-",
      log.source,
      log.complianceRelevant ? "Yes" : "No",
      ip,
      log.aiModel || "-",
      log.aiConfidenceScore ? log.aiConfidenceScore.toFixed(2) : "-",
      log.humanInTheLoop ? "Yes" : "No",
    ]
  })

  const csvRows = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  )

  return csvRows.join("\n")
}

