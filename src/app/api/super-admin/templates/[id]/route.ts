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
import { logTemplateAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-helpers"
import { getClientIp } from "@/lib/audit/get-client-ip"

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
    
    console.log("[Template API] ===== START UPDATE =====")
    console.log("[Template API] Template ID:", id)
    console.log("[Template API] Request Body:", JSON.stringify(body, null, 2))
    
    const { name, description, status, category, categoryLabel, blocks } = body
    console.log("[Template API] Extrahierte Werte:")
    console.log("[Template API]   - Status:", status, "Type:", typeof status, "Truthy:", !!status)
    console.log("[Template API]   - Name:", name)
    console.log("[Template API]   - Description:", description)

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
      console.error("[Template API] Template nicht gefunden:", id)
      return NextResponse.json(
        { error: "Template nicht gefunden" },
        { status: 404 }
      )
    }

    console.log("[Template API] Existing Template:")
    console.log("[Template API]   - Status:", existing.status, "Type:", typeof existing.status)
    console.log("[Template API]   - Status === 'active':", existing.status === "active")
    console.log("[Template API]   - Status === 'draft':", existing.status === "draft")

    // CRITICAL: Templates are IMMUTABLE once active
    // ABER: Erlaube Status-Änderung von draft zu active
    if ((existing.status === "active" || existing.status === "archived") && status !== "active") {
      console.log("[Template API] BLOCKIERT: Template ist bereits active/archived und Status wird nicht auf active geändert")
      return NextResponse.json(
        { error: "Aktive oder archivierte Templates können nicht bearbeitet werden. Bitte erstellen Sie eine neue Version." },
        { status: 400 }
      )
    }
    
    console.log("[Template API] Prüfung bestanden: Template kann bearbeitet werden")

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
    console.log("[Template API] Update Request - Status:", status, "Type:", typeof status, "Truthy:", !!status)
    console.log("[Template API] Update Request - Full body:", JSON.stringify({ name, description, status, categoryLabel }, null, 2))
    
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    // categoryLabel kann bearbeitet werden (sprachlich, nicht regulatorisch)
    if (categoryLabel !== undefined) updateData.categoryLabel = categoryLabel
    
    // Status MUSS immer gesetzt werden, wenn er im Request vorhanden ist
    if (status !== undefined && status !== null) {
      updateData.status = status
      console.log("[Template API] Setze Status auf:", status)
      if (status === "active") {
        updateData.effectiveFrom = new Date()
        console.log("[Template API] Setze effectiveFrom auf:", updateData.effectiveFrom)
      }
    } else {
      console.log("[Template API] WARNUNG: Status ist undefined/null, wird nicht aktualisiert!")
    }

    console.log("[Template API] Update Data:", JSON.stringify(updateData, null, 2))

    const template = await prisma.template.update({
      where: { id },
      data: updateData
    })
    
    console.log("[Template API] Template nach Update - Status:", template.status)

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

    // Audit Log: Template aktualisiert
    const ipAddress = getClientIp(req)
    if (!(session instanceof NextResponse) && session) {
      await logTemplateAction(ACTION_TYPES.UPDATE, id, {
        actorId: session.id,
        actorRole: "super_admin",
        fieldName: "template",
        oldValue: existing,
        newValue: updatedTemplate,
        source: SOURCES.UI,
        complianceRelevant: true, // Template-Änderungen sind compliance-relevant
        ipAddress,
      })
    }

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

    // Audit Log: Template gelöscht (vor dem Löschen)
    const ipAddress = getClientIp(req)
    if (!(session instanceof NextResponse) && session) {
      await logTemplateAction(ACTION_TYPES.DELETE, id, {
        actorId: session.id,
        actorRole: "super_admin",
        oldValue: existing,
        source: SOURCES.UI,
        complianceRelevant: true,
        ipAddress,
      })
    }

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
