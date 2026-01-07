import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { latestPublishedTemplate } from "@/lib/template-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/app/dpp/template-by-category?category=TEXTILE
 * 
 * Lädt das vollständige Template (mit Blöcken) für eine Kategorie
 * Für neue DPPs, die noch keine ID haben
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json(
        { error: "Kategorie-Parameter ist erforderlich" },
        { status: 400 }
      )
    }

    // Lade vollständiges Template für die Kategorie
    const template = await latestPublishedTemplate(category)

    if (!template) {
      return NextResponse.json(
        { error: `Kein Template für die Kategorie "${category}" gefunden` },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return NextResponse.json(
        { error: "Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut." },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

