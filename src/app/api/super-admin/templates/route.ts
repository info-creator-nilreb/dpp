/**
 * SUPER ADMIN TEMPLATES API ROUTE
 * 
 * CRUD operations for templates
 * POST: Create new template
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { logTemplateAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-helpers"
import { getClientIp } from "@/lib/audit/get-client-ip"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await req.json()
    const { name, category, industry, description, blocks } = body

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: "Name und Kategorie sind erforderlich" },
        { status: 400 }
      )
    }

    // Check if active template already exists for this category
    const existingActive = await prisma.template.findFirst({
      where: {
        category,
        status: "active"
      }
    })

    if (existingActive) {
      return NextResponse.json(
        { error: "Es existiert bereits ein aktives Template für diese Kategorie. Bitte erstellen Sie zunächst eine neue Version des bestehenden Templates." },
        { status: 400 }
      )
    }

    // Create template first
    const template = await prisma.template.create({
      data: {
        name,
        category,
        industry: industry || null,
        description: description || null,
        version: 1,
        status: "draft",
        createdBy: session.id
      }
    })

    // Create blocks and fields
    if (blocks && blocks.length > 0) {
      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const block = blocks[blockIndex]
        const createdBlock = await prisma.templateBlock.create({
          data: {
            templateId: template.id,
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
                templateId: template.id,
                blockId: createdBlock.id,
                label: field.label,
                key: field.key,
                type: field.type,
                required: field.required || false,
                isRepeatable: field.isRepeatable || false,
                regulatoryRequired: field.regulatoryRequired || false,
                config: field.config ? JSON.stringify(field.config) : null,
                order: fieldIndex,
                introducedInVersion: 1
              }
            })
          }
        }
      }
    }

    // Fetch complete template with relations
    const completeTemplate = await prisma.template.findUnique({
      where: { id: template.id },
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

    // Audit Log: Template erstellt
    const ipAddress = getClientIp(req)
    await logTemplateAction(ACTION_TYPES.CREATE, template.id, {
      actorId: session.id,
      actorRole: "super_admin",
      newValue: completeTemplate,
      source: SOURCES.UI,
      complianceRelevant: true, // Template-Erstellung ist compliance-relevant
      ipAddress,
    })

    return NextResponse.json({ template: completeTemplate })
  } catch (error: any) {
    console.error("Template creation error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen des Templates" },
      { status: 500 }
    )
  }
}
