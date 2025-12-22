/**
 * SUPER ADMIN ORGANIZATION MEMBERS API
 * 
 * Manage organization members
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createAuditLog, getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST: Add member to organization
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id: organizationId } = await params
    const body = await request.json()
    const { userId, role = "ORG_MEMBER" } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID ist erforderlich" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["ORG_OWNER", "ORG_ADMIN", "ORG_MEMBER", "ORG_VIEWER"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Ungültige Rolle" },
        { status: 400 }
      )
    }

    // Check if organization exists
    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!org) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      )
    }

    // Check if membership already exists
    const existing = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    })

    if (existing) {
      // Update existing membership
      const membership = await prisma.membership.update({
        where: { id: existing.id },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      await createAuditLog({
        action: "organization.member.update",
        entityType: "membership",
        entityId: membership.id,
        before: { role: existing.role },
        after: { role: membership.role, userId, organizationId },
        ipAddress: getClientIp(request),
        userAgent: getClientUserAgent(request)
      })

      return NextResponse.json({ membership })
    }

    // Create new membership
    const membership = await prisma.membership.create({
      data: {
        userId,
        organizationId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    await createAuditLog({
      action: "organization.member.add",
      entityType: "membership",
      entityId: membership.id,
      after: { userId, organizationId, role },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request)
    })

    return NextResponse.json({ membership })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORG_MEMBERS] POST error:", error)
    return NextResponse.json(
      { error: "Fehler beim Hinzufügen des Mitglieds" },
      { status: 500 }
    )
  }
}

// DELETE: Remove member from organization
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id: organizationId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID ist erforderlich" },
        { status: 400 }
      )
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Mitgliedschaft nicht gefunden" },
        { status: 404 }
      )
    }

    await prisma.membership.delete({
      where: { id: membership.id }
    })

    await createAuditLog({
      action: "organization.member.remove",
      entityType: "membership",
      entityId: membership.id,
      before: { userId, organizationId, role: membership.role },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORG_MEMBERS] DELETE error:", error)
    return NextResponse.json(
      { error: "Fehler beim Entfernen des Mitglieds" },
      { status: 500 }
    )
  }
}

