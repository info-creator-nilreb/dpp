import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getCategoriesWithLabels } from "@/lib/template-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/app/categories
 * 
 * Gibt alle verfügbaren Kategorien mit ihren Labels zurück
 * - Erfordert Authentifizierung
 */
export async function GET() {
  try {
    // Authentifizierung prüfen
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const categoriesMap = await getCategoriesWithLabels()
    const categories = Array.from(categoriesMap.values())

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("Error loading categories:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

