/**
 * SUPER ADMIN TEMPLATE API (Single)
 * 
 * Update and manage a specific template
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createAuditLog, getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { prisma } from "@/lib/prisma"
import { getSuperAdminSession } from "@/lib/super-admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: Get template details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    const template = await prisma.template.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_TEMPLATE] GET error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden des Templates" },
      { status: 500 }
    )
  }
}

// PUT: Update template (creates new version)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const adminSession = await getSuperAdminSession()
    const { id } = await params
    const body = await request.json()
    const { category, industry, schemaJson, description, isActive } = body

    // Get current template
    const current = await prisma.template.findUnique({
      where: { id }
    })

    if (!current) {
      return NextResponse.json(
        { error: "Template nicht gefunden" },
        { status: 404 }
      )
    }

    // If schemaJson changed, create new version
    const shouldCreateVersion = schemaJson && schemaJson !== current.schemaJson

    if (shouldCreateVersion) {
      // Validate JSON
      try {
        JSON.parse(schemaJson)
      } catch {
        return NextResponse.json(
          { error: "Ungültiges JSON Schema" },
          { status: 400 }
        )
      }

      // Get latest version
      const latest = await prisma.template.findMany({
        where: { name: current.name },
        orderBy: { version: "desc" },
        take: 1
      })

      const newVersion = latest[0].version + 1

      // Create new version
      const template = await prisma.template.create({
        data: {
          name: current.name,
          category: category !== undefined ? category : current.category,
          industry: industry !== undefined ? industry : current.industry,
          schemaJson,
          description: description !== undefined ? description : current.description,
          version: newVersion,
          isActive: isActive !== undefined ? isActive : current.isActive,
          createdBy: adminSession?.id || null
        }
      })

      await createAuditLog({
        action: "template.update",
        entityType: "template",
        entityId: template.id,
        before: {
          name: current.name,
          version: current.version,
          schemaJson: current.schemaJson
        },
        after: {
          name: template.name,
          version: template.version,
          schemaJson: template.schemaJson
        },
        ipAddress: getClientIp(request),
        userAgent: getClientUserAgent(request)
      })

      return NextResponse.json({ template, isNewVersion: true })
    } else {
      // Update existing template (no version change)
      const updateData: any = {}
      if (category !== undefined) updateData.category = category
      if (industry !== undefined) updateData.industry = industry
      if (description !== undefined) updateData.description = description
      if (isActive !== undefined) updateData.isActive = isActive

      const template = await prisma.template.update({
        where: { id },
        data: updateData
      })

      await createAuditLog({
        action: "template.update",
        entityType: "template",
        entityId: id,
        before: current,
        after: template,
        ipAddress: getClientIp(request),
        userAgent: getClientUserAgent(request)
      })

      return NextResponse.json({ template, isNewVersion: false })
    }
  } catch (error: any) {
    console.error("[SUPER_ADMIN_TEMPLATE] PUT error:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Templates" },
      { status: 500 }
    )
  }
}

// DELETE: Soft delete (deactivate) template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    const current = await prisma.template.findUnique({
      where: { id }
    })

    if (!current) {
      return NextResponse.json(
        { error: "Template nicht gefunden" },
        { status: 404 }
      )
    }

    // Soft delete: deactivate
    const template = await prisma.template.update({
      where: { id },
      data: { isActive: false }
    })

    await createAuditLog({
      action: "template.deactivate",
      entityType: "template",
      entityId: id,
      before: { isActive: current.isActive },
      after: { isActive: template.isActive },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request)
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_TEMPLATE] DELETE error:", error)
    return NextResponse.json(
      { error: "Fehler beim Deaktivieren des Templates" },
      { status: 500 }
    )
  }
}

