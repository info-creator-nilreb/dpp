/**
 * SUPER ADMIN AUDIT LOGGING
 * 
 * Logs all Super Admin actions for compliance and security.
 */

import { prisma } from "@/lib/prisma"
import { getSuperAdminSession } from "./super-admin-auth"

export interface AuditLogData {
  action: string
  entityType: string
  entityId: string
  before?: any
  after?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Create audit log entry
 * 
 * Should be called for ALL Super Admin actions:
 * - Organization status changes
 * - Subscription changes
 * - Feature toggles
 * - Template edits
 * - User management
 * - License tier changes
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const session = await getSuperAdminSession()

    if (!session) {
      // If no session, we can't audit - this should never happen in normal flow
      console.error("[AUDIT] Attempted to create audit log without session")
      return
    }

    await prisma.auditLog.create({
      data: {
        superAdminId: session.id,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        before: data.before ? JSON.stringify(data.before) : null,
        after: data.after ? JSON.stringify(data.after) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      }
    })
  } catch (error) {
    // Don't fail the operation if audit logging fails
    console.error("[AUDIT] Failed to create audit log:", error)
  }
}

/**
 * Helper to get IP address from request
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }
  return undefined
}

/**
 * Helper to get User Agent from request
 */
export function getClientUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined
}

