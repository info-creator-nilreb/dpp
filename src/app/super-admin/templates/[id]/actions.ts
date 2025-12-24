"use server"

/**
 * Server Actions for Template Editor
 */

import { prisma } from "@/lib/prisma"
import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"

export async function createNewTemplateVersion(templateId: string) {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }

  if (!requirePermission(session, "template", "update")) {
    throw new Error("Keine Berechtigung")
  }

  // Get existing template with all blocks and fields
  const existing = await prisma.template.findUnique({
    where: { id: templateId },
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
    throw new Error("Template nicht gefunden")
  }

  if (existing.status !== "active") {
    throw new Error("Nur aktive Templates können als neue Version erstellt werden")
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
      supersedesVersion: existing.version,
      createdBy: session.id
      // effectiveFrom bleibt null (wird nur bei Aktivierung gesetzt)
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
          introducedInVersion: newVersion // New version for cloned fields
        }
      })
    }
  }

  return { templateId: newTemplate.id }
}

