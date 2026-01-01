export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/debug/templates
 * 
 * Debug-Endpoint zum Anzeigen aller Templates in der Datenbank
 * Nur für Entwicklung/Debugging
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Hole alle Templates
    const allTemplates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        version: true,
        categoryLabel: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { category: "asc" },
        { version: "desc" }
      ]
    })

    // Prüfe aktive Templates
    const activeTemplates = allTemplates.filter(t => 
      t.status && t.status.toLowerCase() === "active"
    )

    // Prüfe auch mit Prisma-Abfrage
    const prismaActiveTemplates = await prisma.template.findMany({
      where: {
        status: "active"
      },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        version: true
      }
    })

    return NextResponse.json({
      total: allTemplates.length,
      active_manual: activeTemplates.length,
      active_prisma: prismaActiveTemplates.length,
      allTemplates: allTemplates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        status: t.status,
        version: t.version,
        categoryLabel: t.categoryLabel,
        statusLowercase: t.status?.toLowerCase(),
        isActive: t.status?.toLowerCase() === "active",
        statusLength: t.status?.length,
        statusCharCodes: t.status?.split("").map(c => c.charCodeAt(0))
      })),
      activeTemplates_manual: activeTemplates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        status: t.status,
        version: t.version
      })),
      activeTemplates_prisma: prismaActiveTemplates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        status: t.status,
        version: t.version
      }))
    })
  } catch (error: any) {
    console.error("Error in debug templates:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

