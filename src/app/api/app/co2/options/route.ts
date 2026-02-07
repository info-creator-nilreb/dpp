/**
 * GET /api/app/co2/options
 *
 * Liefert Material- und Verpackungsoptionen für das CO₂-Modal.
 * Mit CLIMATIQ_API_KEY: aus Climatiq Search (sector/category).
 * Ohne Key: Fallback-Liste mit Climatiq-kompatiblen activity_ids.
 */

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAvailableFeatures } from "@/lib/capabilities/resolver"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const CLIMATIQ_SEARCH_URL = "https://api.climatiq.io/data/v1/search"
const DATA_VERSION = "^4"

/** Fallback: Climatiq-kompatible activity_ids (aus Data Explorer / Dokumentation). */
const FALLBACK_MATERIALS: { activity_id: string; label: string }[] = [
  { activity_id: "textiles-type_textiles", label: "Textil / Textilien" },
  { activity_id: "plastic_materials", label: "Kunststoff" },
  { activity_id: "wood_products", label: "Holz" },
  { activity_id: "metals-type_steel_section", label: "Metall / Stahl" },
  { activity_id: "paper_and_cardboard", label: "Papier / Karton" },
  { activity_id: "glass", label: "Glas" },
  { activity_id: "leather", label: "Leder" },
  { activity_id: "ceramic", label: "Keramik" },
  { activity_id: "other_materials", label: "Sonstiges" },
]

const FALLBACK_PACKAGING: { activity_id: string; label: string }[] = [
  { activity_id: "corrugated_cardboard", label: "Karton / Wellpappe" },
  { activity_id: "plastic_packaging", label: "Kunststoff" },
  { activity_id: "glass_packaging", label: "Glas" },
  { activity_id: "metal_packaging", label: "Metall" },
  { activity_id: "mixed_packaging", label: "Gemischt" },
  { activity_id: "other_packaging", label: "Sonstiges" },
]

async function fetchClimatiqSearch(
  apiKey: string,
  query: string,
  sector?: string
): Promise<{ activity_id: string; name: string }[]> {
  const params = new URLSearchParams({
    data_version: DATA_VERSION,
    query: query,
    results_per_page: "50",
  })
  if (sector) params.set("sector", sector)
  const res = await fetch(`${CLIMATIQ_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  const results = data.results || []
  const seen = new Set<string>()
  return results
    .filter((r: { activity_id?: string; name?: string }) => r.activity_id && r.name)
    .map((r: { activity_id: string; name: string }) => ({ activity_id: r.activity_id, name: r.name }))
    .filter((r: { activity_id: string }) => {
      if (seen.has(r.activity_id)) return false
      seen.add(r.activity_id)
      return true
    })
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { organization: { select: { id: true } } },
    })
    if (!membership?.organization) {
      return NextResponse.json({ error: "Organisation nicht gefunden" }, { status: 404 })
    }

    const features = await getAvailableFeatures({
      organizationId: membership.organization.id,
      userId: session.user.id,
    })
    if (!features.includes("co2_calculation")) {
      return NextResponse.json(
        { error: "CO₂-Optionen nur im Premium-Tarif verfügbar." },
        { status: 403 }
      )
    }

    const apiKey = process.env.CLIMATIQ_API_KEY

    if (apiKey) {
      try {
        const [materialResults, packagingResults] = await Promise.all([
          fetchClimatiqSearch(apiKey, "material product", "Materials and manufacturing"),
          fetchClimatiqSearch(apiKey, "packaging"),
        ])

        const materials =
          materialResults.length > 0
            ? materialResults.slice(0, 30).map((r) => ({ activity_id: r.activity_id, label: r.name }))
            : FALLBACK_MATERIALS
        const packaging =
          packagingResults.length > 0
            ? packagingResults.slice(0, 20).map((r) => ({ activity_id: r.activity_id, label: r.name }))
            : FALLBACK_PACKAGING

        return NextResponse.json({ materials, packaging, source: "climatiq" })
      } catch (err) {
        console.warn("[CO2 options] Climatiq search failed, using fallback:", err)
      }
    }

    return NextResponse.json({
      materials: FALLBACK_MATERIALS,
      packaging: FALLBACK_PACKAGING,
      source: "fallback",
    })
  } catch (err) {
    console.error("[CO2 options] Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Serverfehler" },
      { status: 500 }
    )
  }
}
