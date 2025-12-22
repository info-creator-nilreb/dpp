/**
 * SUPER ADMIN ORGANIZATION API (Single)
 * 
 * Update and manage a specific organization
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createAuditLog, getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: Get organization details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            dpps: true
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORG] GET error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Organisation" },
      { status: 500 }
    )
  }
}

// PUT: Update organization
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params
    const body = await request.json()
    const { name, licenseTier, status } = body

    // Get current state for audit
    const current = await prisma.organization.findUnique({
      where: { id },
      select: {
        name: true,
        licenseTier: true,
        status: true
      }
    })

    if (!current) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Validate license tier if provided
    if (licenseTier) {
      const validTiers = ["free", "basic", "premium", "pro"]
      if (!validTiers.includes(licenseTier)) {
        return NextResponse.json(
          { error: "Ungültiger License Tier" },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["active", "suspended", "archived"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Ungültiger Status" },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (licenseTier !== undefined) updateData.licenseTier = licenseTier
    if (status !== undefined) updateData.status = status

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData,
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            dpps: true
          }
        }
      }
    })

    // Audit log
    await createAuditLog({
      action: "organization.update",
      entityType: "organization",
      entityId: id,
      before: current,
      after: {
        name: organization.name,
        licenseTier: organization.licenseTier,
        status: organization.status
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request)
    })

    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORG] PUT error:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Organisation" },
      { status: 500 }
    )
  }
}

