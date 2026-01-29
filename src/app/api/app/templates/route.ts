export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAllPublishedTemplates, getPublishedTemplatesByCategory, latestPublishedTemplate } from "@/lib/template-helpers"

/**
 * GET /api/app/templates
 * 
 * Gibt alle veröffentlichten Templates zurück
 * - Single source of truth für Template-Abfragen
 * - Erfordert Authentifizierung
 * 
 * Query-Parameter:
 * - groupByCategory: Wenn true, werden Templates nach Kategorie gruppiert zurückgegeben
 * - category: Wenn angegeben, wird das neueste aktive Template für diese Kategorie zurückgegeben
 */
export async function GET(request: Request) {
  try {
    // Authentifizierung prüfen
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupByCategory = searchParams.get("groupByCategory") === "true"
    const category = searchParams.get("category")

    // Wenn category angegeben ist, lade das neueste aktive Template für diese Kategorie
    if (category) {
      const template = await latestPublishedTemplate(category)
      if (!template) {
        return NextResponse.json(
          { error: `Kein aktives Template für die Kategorie "${category}" gefunden` },
          { status: 404 }
        )
      }
      return NextResponse.json({
        template: {
          id: template.id,
          name: template.name,
          category: template.category,
          version: template.version,
          label: `${template.categoryLabel || template.category} - ${template.name} (v${template.version})`
        }
      })
    }

    if (groupByCategory) {
      const templatesByCategory = await getPublishedTemplatesByCategory()
      const result: Record<string, typeof templatesByCategory extends Map<string, infer V> ? V : never> = {}
      
      for (const [cat, templates] of templatesByCategory.entries()) {
        result[cat] = templates
      }

      return NextResponse.json({
        templatesByCategory: result
      })
    } else {
      const templates = await getAllPublishedTemplates()
      return NextResponse.json({
        templates
      })
    }
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return NextResponse.json(
        { error: "Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut." },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten beim Laden der Templates" },
      { status: 500 }
    )
  }
}

