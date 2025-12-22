/**
 * SUPER ADMIN TEMPLATES API
 * 
 * CRUD operations for DPP templates
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createAuditLog, getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { prisma } from "@/lib/prisma"
import { getSuperAdminSession } from "@/lib/super-admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: List all templates
export async function GET(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const industry = searchParams.get("industry")
    const isActive = searchParams.get("isActive")
    const search = searchParams.get("search")

    const where: any = {}
    if (category) where.category = category
    if (industry) where.industry = industry
    if (isActive !== null) where.isActive = isActive === "true"
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { name: "asc" },
        { version: "desc" }
      ]
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_TEMPLATES] GET error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Templates" },
      { status: 500 }
    )
  }
}

// POST: Create new template
export async function POST(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const adminSession = await getSuperAdminSession()
    const body = await request.json()
    const { name, category, industry, schemaJson, description } = body

    if (!name || !schemaJson) {
      return NextResponse.json(
        { error: "Name und Schema JSON sind erforderlich" },
        { status: 400 }
      )
    }

    // Validate category if provided
    if (category) {
      const validCategories = ["TEXTILE", "FURNITURE", "OTHER"]
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: "Ungültige Kategorie" },
          { status: 400 }
        )
      }
    }

    // Check if template with same name exists, get latest version
    const existing = await prisma.template.findMany({
      where: { name },
      orderBy: { version: "desc" },
      take: 1
    })

    const version = existing.length > 0 ? existing[0].version + 1 : 1

    // Validate JSON schema
    try {
      JSON.parse(schemaJson)
    } catch {
      return NextResponse.json(
        { error: "Ungültiges JSON Schema" },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        category: category || null,
        industry: industry || null,
        schemaJson,
        description: description || null,
        version,
        isActive: true,
        createdBy: adminSession?.id || null
      }
    })

    await createAuditLog({
      action: "template.create",
      entityType: "template",
      entityId: template.id,
      after: {
        name: template.name,
        category: template.category,
        version: template.version
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request)
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_TEMPLATES] POST error:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Templates" },
      { status: 500 }
    )
  }
}

