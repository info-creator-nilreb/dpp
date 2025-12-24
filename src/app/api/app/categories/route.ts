import { NextResponse } from "next/server"
import { getCategoriesWithLabels } from "@/lib/template-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/app/categories
 * 
 * Gibt alle verfügbaren Kategorien mit ihren Labels zurück
 */
export async function GET() {
  try {
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

