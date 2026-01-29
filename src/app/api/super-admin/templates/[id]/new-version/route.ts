/**
 * SUPER ADMIN TEMPLATE NEW VERSION API ROUTE
 * 
 * Create a new version of an active template
 * POST: Create new draft version from active template
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    // Get existing template with all blocks and fields
    const existing = await prisma.template.findUnique({
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

    if (!existing) {
      return NextResponse.json(
        { error: "Template nicht gefunden" },
        { status: 404 }
      )
    }

    if (existing.status !== "active") {
      return NextResponse.json(
        { error: "Nur aktive Templates können als neue Version erstellt werden" },
        { status: 400 }
      )
    }

    // Create new draft version
    const newVersion = existing.version + 1
    const newTemplate = await prisma.template.create({
      data: {
        name: existing.name,
        category: existing.category!,
        industry: existing.industry,
        version: newVersion,
        status: "draft",
        description: existing.description,
        effectiveFrom: null,
        supersedesVersion: existing.version,
        createdBy: session.id
      }
    })

    // Clone blocks and fields
    for (const block of existing.blocks) {
      const newBlock = await prisma.templateBlock.create({
        data: {
          templateId: newTemplate.id,
          name: block.name,
          order: block.order
        }
      })

      for (const field of block.fields) {
        await prisma.templateField.create({
          data: {
            templateId: newTemplate.id,
            blockId: newBlock.id,
            label: field.label,
            key: field.key,
            type: field.type,
            required: field.required,
            regulatoryRequired: field.regulatoryRequired || false,
            config: field.config,
            order: field.order,
            isRepeatable: (field as { isRepeatable?: boolean }).isRepeatable ?? false,
            introducedInVersion: newVersion // New version for cloned fields
          }
        })
      }
    }

    // Fetch complete new template
    const completeTemplate = await prisma.template.findUnique({
      where: { id: newTemplate.id },
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

    return NextResponse.json({ template: completeTemplate })
  } catch (error: any) {
    console.error("Template new version error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen der neuen Version" },
      { status: 500 }
    )
  }
}

