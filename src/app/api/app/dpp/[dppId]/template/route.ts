export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { requireViewDPP } from "@/lib/api-permissions"
import { latestPublishedTemplate } from "@/lib/template-helpers"

/**
 * GET /api/app/dpp/[dppId]/template
 *
 * Liefert das aktuelle Template (mit Blöcken) für die DPP-Kategorie.
 * Für Pflichtdaten-Tab: Block-Liste inkl. Basisdaten (order 0) und Datenblöcke (order > 0).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireViewDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const { prisma } = await import("@/lib/prisma")
    const dpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      select: { category: true },
    })

    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

    const template = await latestPublishedTemplate(dpp.category)
    if (!template) {
      return NextResponse.json(
        { error: `Kein Template für Kategorie ${dpp.category} gefunden` },
        { status: 404 }
      )
    }

    const blocks = (template.blocks || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      order: b.order,
      fields: (b.fields || []).map((f: any) => ({
        id: f.id,
        label: f.label,
        key: f.key,
        type: f.type,
        required: f.required,
        config: f.config,
        order: f.order,
        isRepeatable: f.isRepeatable,
      })),
    }))

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        blocks,
      },
    })
  } catch (error: any) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
