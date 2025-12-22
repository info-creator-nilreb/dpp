/**
 * SUPER ADMIN ORGANIZATIONS API
 * 
 * CRUD operations for organizations
 * Requires: support_admin or super_admin role
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createAuditLog, getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: List all organizations
export async function GET(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const licenseTier = searchParams.get("licenseTier")
    const search = searchParams.get("search")

    const where: any = {}
    if (status) where.status = status
    if (licenseTier) where.licenseTier = licenseTier
    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            memberships: true,
            dpps: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ organizations })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORGS] GET error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Organisationen" },
      { status: 500 }
    )
  }
}

// POST: Create new organization
export async function POST(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await request.json()
    const { name, licenseTier = "free" } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 }
      )
    }

    // Validate license tier
    const validTiers = ["free", "basic", "premium", "pro"]
    if (!validTiers.includes(licenseTier)) {
      return NextResponse.json(
        { error: "Ungültiger License Tier" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        licenseTier,
        status: "active"
      },
      include: {
        _count: {
          select: {
            memberships: true,
            dpps: true
          }
        }
      }
    })

    // Audit log
    await createAuditLog({
      action: "organization.create",
      entityType: "organization",
      entityId: organization.id,
      after: { name: organization.name, licenseTier: organization.licenseTier, status: organization.status },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request)
    })

    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORGS] POST error:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Organisation" },
      { status: 500 }
    )
  }
}

