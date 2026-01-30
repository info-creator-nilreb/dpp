/**
 * GET /api/audit-logs/[logId]
 * 
 * Retrieves a single audit log entry with full details
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessAuditLogs, canSeeIpAddresses } from "@/lib/audit/audit-access"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const log = await prisma.platformAuditLog.findUnique({
      where: { id: logId },
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

    if (!log) {
      return NextResponse.json({ error: "Audit Log nicht gefunden" }, { status: 404 })
    }

    // Check access
    const hasAccess = await canAccessAuditLogs(session.user.id, log.organizationId || undefined)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diesen Audit Log" },
        { status: 403 }
      )
    }

    const canSeeIp = await canSeeIpAddresses(session.user.id)

    // Sanitize log
    const sanitized = {
      ...log,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
      aiInputSources: log.aiInputSources ? JSON.parse(log.aiInputSources) : null,
    }

    if (!canSeeIp && sanitized.ipAddress) {
      sanitized.ipAddress = maskIpAddress(sanitized.ipAddress)
    }

    return NextResponse.json({ log: sanitized })
  } catch (error: any) {
    console.error("Error fetching audit log:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

function maskIpAddress(ip: string): string {
  const parts = ip.split(".")
  if (parts.length === 4) {
    return `${parts[0]}.xxx.xxx.xxx`
  }
  return "xxx.xxx.xxx.xxx"
}

