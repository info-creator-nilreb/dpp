import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { latestPublishedTemplate } from "@/lib/template-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/app/dpps/csv-template?category=TEXTILE
 * 
 * Gibt ein CSV-Template für den DPP-Import zurück
 * - Verwendet das aktuelle veröffentlichte Template der Kategorie
 * - Generiert CSV-Header basierend auf Template-Feldern
 * - 1 Beispiel-Datensatz
 * - Erfordert Authentifizierung
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
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json(
        { error: "Kategorie-Parameter ist erforderlich" },
        { status: 400 }
      )
    }

    // Lade aktuelles veröffentlichtes Template für die Kategorie
    const template = await latestPublishedTemplate(category)

    if (!template) {
      return NextResponse.json(
        { error: `Kein veröffentlichtes Template für die Kategorie "${category}" gefunden.` },
        { status: 404 }
      )
    }

    // Sammle alle Felder aus allen Blöcken (sortiert nach Block-Order und Feld-Order)
    const fields: Array<{ label: string; key: string; required: boolean }> = []
    for (const block of template.blocks) {
      for (const field of block.fields) {
        fields.push({
          label: field.label,
          key: field.key,
          required: field.required
        })
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "Template enthält keine Felder" },
        { status: 400 }
      )
    }

    // CSV-Header: Verwende Label für bessere Lesbarkeit, aber Key für Maschinen
    // Format: "Label (key)"
    const headers = fields.map(f => {
      // Escape Kommas in Labels
      const escapedLabel = f.label.replace(/"/g, '""')
      return `"${escapedLabel} (${f.key})"`
    })

    // Beispiel-Datensatz mit leeren Werten (User füllt aus)
    const exampleRow = fields.map(f => {
      // Für required Felder einen Beispielwert, sonst leer
      if (f.required) {
        return `"Beispielwert für ${f.label}"`
      }
      return `""`
    })

    // CSV-Zeilen erstellen
    const csvRows = [
      headers.join(","),
      exampleRow.join(",")
    ]

    const csvContent = csvRows.join("\n")

    // CSV als Response zurückgeben
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dpp-template-${category.toLowerCase()}-v${template.version}.csv"`
      }
    })
  } catch (error: any) {
    console.error("Error generating CSV template:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

