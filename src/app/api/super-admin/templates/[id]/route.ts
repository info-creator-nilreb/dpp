/**
 * SUPER ADMIN TEMPLATE API ROUTE
 * 
 * CRUD operations for a specific template
 * PUT: Update template
 * DELETE: Archive template (soft delete via status)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, status, category, categoryLabel, blocks } = body

    // Get existing template
    const existing = await prisma.template.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            fields: true
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template nicht gefunden" },
        { status: 404 }
      )
    }

    // CRITICAL: Templates are IMMUTABLE once active
    if (existing.status === "active" || existing.status === "archived") {
      return NextResponse.json(
        { error: "Aktive oder archivierte Templates können nicht bearbeitet werden. Bitte erstellen Sie eine neue Version." },
        { status: 400 }
      )
    }

    // GUARDRAIL: Kategorie-Key ist IMMUTABLE (immutable nach Erstellung)
    if (category && category !== existing.category) {
      return NextResponse.json(
        { error: "Die Kategorie eines Templates kann nach der Erstellung nicht geändert werden. Bitte erstellen Sie ein neues Template für die gewünschte Kategorie." },
        { status: 400 }
      )
    }

    // If status is being changed to active, check if another active template exists for this category
    if (status === "active" && existing.status !== "active") {
      const existingActive = await prisma.template.findFirst({
        where: {
          category: existing.category!,
          status: "active",
          id: { not: id }
        }
      })

      if (existingActive) {
        return NextResponse.json(
          { error: "Es existiert bereits ein aktives Template für diese Kategorie. Bitte archivieren Sie das bestehende Template zuerst." },
          { status: 400 }
        )
      }
    }

    // Update template basic info (only for drafts)
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    // categoryLabel kann bearbeitet werden (sprachlich, nicht regulatorisch)
    if (categoryLabel !== undefined) updateData.categoryLabel = categoryLabel
    if (status) {
      updateData.status = status
      if (status === "active") {
        updateData.effectiveFrom = new Date()
      }
    }

    const template = await prisma.template.update({
      where: { id },
      data: updateData
    })

    // If blocks are provided, update them (this is a simplified version - full implementation would handle add/update/delete)
    if (blocks) {
      // Delete all existing blocks (cascade will delete fields)
      await prisma.templateBlock.deleteMany({
        where: { templateId: id }
      })

      // Create new blocks
      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const block = blocks[blockIndex]
        const createdBlock = await prisma.templateBlock.create({
          data: {
            templateId: id,
            name: block.name,
            order: blockIndex
          }
        })

        // Create fields for this block
        if (block.fields && block.fields.length > 0) {
          for (let fieldIndex = 0; fieldIndex < block.fields.length; fieldIndex++) {
            const field = block.fields[fieldIndex]
            await prisma.templateField.create({
              data: {
                templateId: id,
                blockId: createdBlock.id,
                label: field.label,
                key: field.key,
                type: field.type,
                required: field.required || false,
                regulatoryRequired: field.regulatoryRequired || false,
                config: field.config ? JSON.stringify(field.config) : null,
                order: fieldIndex,
                introducedInVersion: existing.version
              }
            })
          }
        }
      }
    }

    // Fetch updated template
    const updatedTemplate = await prisma.template.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { order: "asc" },
          include: {
            fields: {
              orderBy: { order: "asc" }
            }
          }
        }
      }
    })

    return NextResponse.json({ template: updatedTemplate })
  } catch (error: any) {
    console.error("Template update error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Aktualisieren des Templates" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    // Get existing template to check status
    const existing = await prisma.template.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            fields: true
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template nicht gefunden" },
        { status: 404 }
      )
    }

    // CRITICAL: Only draft templates can be deleted
    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Nur Templates im Status 'Entwurf' können gelöscht werden. Veröffentlichte Templates müssen archiviert werden." },
        { status: 400 }
      )
    }

    // Hard delete: Delete blocks, fields, and then template
    // Delete fields first (due to foreign key constraints)
    await prisma.templateField.deleteMany({
      where: { templateId: id }
    })

    // Delete blocks
    await prisma.templateBlock.deleteMany({
      where: { templateId: id }
    })

    // Delete template
    await prisma.template.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Template delete error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Löschen des Templates" },
      { status: 500 }
    )
  }
}
