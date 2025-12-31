export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { prisma } from "@/lib/prisma"
import { createAuditLog, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "@/lib/audit/audit-service"

/**
 * PUT /api/super-admin/users/[id]
 * 
 * Update user personal data and role
 * Requires: user update permission
 */
export async function PUT(
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

    if (!requirePermission(session, "user", "update")) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, role } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Vorname und Nachname sind erforderlich" },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role) {
      const validRoles = ["ORG_ADMIN", "EDITOR", "VIEWER"]
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Ungültige Rolle" },
          { status: 400 }
        )
      }
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          where: { userId: id },
          take: 1
        }
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      )
    }

    const currentMembership = currentUser.memberships[0]
    const currentRole = currentMembership?.role || null

    // Prepare update data
    const updateData: any = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    // Update role if provided and different
    if (role && role !== currentRole && currentMembership) {
      await prisma.membership.update({
        where: { id: currentMembership.id },
        data: { role }
      })
    }

    // Audit log
    const changedFields: Record<string, any> = {}
    if (currentUser.firstName !== firstName) {
      changedFields.firstName = { from: currentUser.firstName, to: firstName }
    }
    if (currentUser.lastName !== lastName) {
      changedFields.lastName = { from: currentUser.lastName, to: lastName }
    }
    if (role && role !== currentRole) {
      changedFields.role = { from: currentRole, to: role }
    }

    if (Object.keys(changedFields).length > 0) {
      await createAuditLog({
        actorId: session.id,
        actorRole: "SUPER_ADMIN",
        organizationId: currentUser.organizationId || undefined,
        actionType: ACTION_TYPES.UPDATE,
        entityType: ENTITY_TYPES.USER,
        entityId: id,
        source: SOURCES.UI,
        complianceRelevant: true,
        metadata: {
          superAdminAction: "super_admin.user.updated",
          targetUserId: id,
          targetUserEmail: updatedUser.email,
          changedFields,
        }
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        role: role || currentRole,
      }
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_UPDATE_USER] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

