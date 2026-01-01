export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAllPublishedTemplates, getPublishedTemplatesByCategory } from "@/lib/template-helpers"

/**
 * GET /api/app/templates
 * 
 * Gibt alle veröffentlichten Templates zurück
 * - Single source of truth für Template-Abfragen
 * - Erfordert Authentifizierung
 * 
 * Query-Parameter:
 * - groupByCategory: Wenn true, werden Templates nach Kategorie gruppiert zurückgegeben
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

    if (groupByCategory) {
      const templatesByCategory = await getPublishedTemplatesByCategory()
      const result: Record<string, typeof templatesByCategory extends Map<string, infer V> ? V : never> = {}
      
      for (const [category, templates] of templatesByCategory.entries()) {
        result[category] = templates
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
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten beim Laden der Templates" },
      { status: 500 }
    )
  }
}

