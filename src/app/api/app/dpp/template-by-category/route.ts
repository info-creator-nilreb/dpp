export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { latestPublishedTemplate } from "@/lib/template-helpers"

/**
 * GET /api/app/dpp/template-by-category?category=...
 *
 * Liefert das aktuelle Template (mit Blöcken) für die angegebene Kategorie.
 * Für neue DPPs (isNew), wenn noch keine dppId existiert.
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    if (!category) {
      return NextResponse.json({ error: "category ist erforderlich" }, { status: 400 })
    }

    const template = await latestPublishedTemplate(category)
    if (!template) {
      return NextResponse.json(
        { error: `Kein Template für Kategorie ${category} gefunden` },
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
    console.error("Error fetching template by category:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
