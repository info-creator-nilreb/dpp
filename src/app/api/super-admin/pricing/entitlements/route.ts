/**
 * SUPER ADMIN ENTITLEMENTS API ROUTE
 * 
 * CRUD operations for entitlements
 * GET: List all entitlements
 * POST: Create new entitlement
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { logEntitlementAction } from "@/lib/audit/audit-helpers"
import { ACTION_TYPES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/audit-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const entitlements = await prisma.entitlement.findMany({
      orderBy: {
        key: "asc"
      }
    })

    return NextResponse.json({ entitlements }, { status: 200 })
  } catch (error: any) {
    console.error("[Entitlements GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Entitlements" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await req.json()
    const { key, type, unit } = body

    // Validate required fields
    if (!key || !type) {
      return NextResponse.json(
        { error: "Key und Type sind erforderlich" },
        { status: 400 }
      )
    }

    if (!["limit", "boolean"].includes(type)) {
      return NextResponse.json(
        { error: "Type muss 'limit' oder 'boolean' sein" },
        { status: 400 }
      )
    }

    // Check if entitlement already exists
    const existing = await prisma.entitlement.findUnique({
      where: { key }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ein Entitlement mit diesem Key existiert bereits" },
        { status: 400 }
      )
    }

    // Create entitlement
    const entitlement = await prisma.entitlement.create({
      data: {
        key,
        type,
        unit: unit || null
      }
    })

    // Audit log: Entitlement created
    const ipAddress = getClientIp(req)
    await logEntitlementAction(ACTION_TYPES.CREATE, entitlement.id, {
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      newValue: {
        key,
        type,
        unit
      },
      source: "API",
      ipAddress
    })

    return NextResponse.json({ entitlement }, { status: 201 })
  } catch (error: any) {
    console.error("[Entitlements POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen des Entitlements" },
      { status: 500 }
    )
  }
}

