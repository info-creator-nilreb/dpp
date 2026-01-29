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

    // Sequenzielles Laden statt Promise.all, um Connection Pool Overflow zu vermeiden
    // In Production kann paralleles Laden zu "MaxClientsInSessionMode" Fehlern führen
    let logs: any[]
    let total: number
    
    try {
      logs = await prisma.auditLog.findMany({
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
      })
      
      total = await prisma.auditLog.count({ where })
    } catch (dbError: any) {
      // Connection Pool Overflow oder andere DB-Fehler abfangen
      if (
        dbError?.message?.includes("MaxClientsInSessionMode") ||
        dbError?.message?.includes("max clients reached") ||
        dbError?.code === "P1001"
      ) {
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
      throw dbError
    }

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
    
    return NextResponse.json(
      { error: "Fehler beim Laden der Audit Logs" },
      { status: 500 }
    )
  }
}

