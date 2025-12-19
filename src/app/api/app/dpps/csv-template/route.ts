import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/app/dpps/csv-template?category=TEXTILE
 * 
 * Gibt ein CSV-Template für den DPP-Import zurück
 * - Pflichtfelder: name, category, sku, brand, countryOfOrigin
 * - Optionale Felder: description
 * - 1 Beispiel-Datensatz
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "TEXTILE"

    // Validiere Kategorie
    if (!["TEXTILE", "FURNITURE", "OTHER"].includes(category)) {
      return NextResponse.json(
        { error: "Ungültige Kategorie. Erlaubt: TEXTILE, FURNITURE, OTHER" },
        { status: 400 }
      )
    }

    // Beispiel-Datensätze je nach Kategorie
    const exampleData: Record<string, { name: string; description: string; sku: string; brand: string; countryOfOrigin: string }> = {
      TEXTILE: {
        name: "Bio-Baumwoll T-Shirt",
        description: "Nachhaltiges T-Shirt aus 100% Bio-Baumwolle",
        sku: "TSH-001",
        brand: "EcoWear",
        countryOfOrigin: "Deutschland"
      },
      FURNITURE: {
        name: "Eichentisch",
        description: "Massivholztisch aus nachhaltiger Forstwirtschaft",
        sku: "TAB-001",
        brand: "WoodCraft",
        countryOfOrigin: "Österreich"
      },
      OTHER: {
        name: "Nachhaltiges Produkt",
        description: "Beispielprodukt",
        sku: "PRD-001",
        brand: "EcoBrand",
        countryOfOrigin: "Deutschland"
      }
    }

    const example = exampleData[category]

    // CSV-Header
    const headers = ["name", "description", "category", "sku", "brand", "countryOfOrigin"]
    
    // CSV-Zeilen erstellen
    const csvRows = [
      headers.join(","),
      [
        `"${example.name}"`,
        `"${example.description}"`,
        category,
        `"${example.sku}"`,
        `"${example.brand}"`,
        `"${example.countryOfOrigin}"`
      ].join(",")
    ]

    const csvContent = csvRows.join("\n")

    // CSV als Response zurückgeben
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dpp-template-${category.toLowerCase()}.csv"`
      }
    })
  } catch (error: any) {
    console.error("Error generating CSV template:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

