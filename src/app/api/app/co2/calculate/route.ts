/**
 * POST /api/app/co2/calculate
 *
 * Premium feature: Proxy to Climatiq (or stub) for CO₂e estimation.
 * Body: { scope, weight_kg, country?, transport_mode?, material_type?, packaging_type? }
 * Returns: { co2e, co2e_unit, breakdown? }
 */

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAvailableFeatures } from "@/lib/capabilities/resolver"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const CLIMATIQ_ESTIMATE_URL = "https://api.climatiq.io/data/v1/estimate"

export async function POST(request: Request) {
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
        { error: "CO₂-Berechnung ist nur im Premium-Tarif verfügbar." },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const scope = (body.scope as string) || "material"
    const weightKg = typeof body.weight_kg === "number" ? body.weight_kg : parseFloat(body.weight_kg)
    const materialType = (body.material_type as string) || undefined
    const packagingType = (body.packaging_type as string) || undefined
    const apiKey = process.env.CLIMATIQ_API_KEY

    if (!weightKg || Number.isNaN(weightKg) || weightKg <= 0) {
      return NextResponse.json(
        { error: "Ein gültiges Gewicht (weight_kg) ist erforderlich." },
        { status: 400 }
      )
    }

    if (apiKey) {
      try {
        const res = await fetch(CLIMATIQ_ESTIMATE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            emission_factor: {
              activity_id: "freight_transport-road_vehicle-light_goods_vehicle",
              data_version: "^4",
            },
            parameters: {
              weight: weightKg,
              weight_unit: "kg",
              distance: 100,
              distance_unit: "km",
            },
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          console.error("[CO2 calculate] Climatiq error:", data)
          return NextResponse.json(
            { error: data.detail || data.message || "Climatiq-Anfrage fehlgeschlagen" },
            { status: res.status >= 400 ? res.status : 502 }
          )
        }

        const co2e = data.co2e ?? 0
        const co2eUnit = data.co2e_unit ?? "kg"
        return NextResponse.json({
          co2e,
          co2e_unit: co2eUnit,
          breakdown: scope === "combination" ? { material: co2e * 0.4, transport: co2e * 0.4, packaging: co2e * 0.2 } : undefined,
        })
      } catch (err) {
        console.error("[CO2 calculate] Climatiq request failed:", err)
        return NextResponse.json(
          { error: "Externe CO₂-Berechnung vorübergehend nicht verfügbar." },
          { status: 502 }
        )
      }
    }

    // Stub when no API key: material/packaging können activity_id (Climatiq) sein – auf Stub-Schlüssel mappen
    const activityIdToMaterialKey: Record<string, string> = {
      "textiles-type_textiles": "textile",
      plastic_materials: "plastic",
      wood_products: "wood",
      "metals-type_steel_section": "metal",
      paper_and_cardboard: "paper_cardboard",
      glass: "glass",
      leather: "leather",
      ceramic: "ceramic",
      other_materials: "other",
    }
    const activityIdToPackagingKey: Record<string, string> = {
      corrugated_cardboard: "cardboard",
      plastic_packaging: "plastic",
      glass_packaging: "glass",
      metal_packaging: "metal",
      mixed_packaging: "mixed",
      other_packaging: "other",
    }
    const materialMultipliers: Record<string, number> = {
      plastic: 2.5,
      wood: 0.8,
      metal: 1.8,
      textile: 1.2,
      paper_cardboard: 0.9,
      glass: 0.7,
      leather: 1.5,
      ceramic: 1.1,
      other: 2,
    }
    const packagingMultipliers: Record<string, number> = {
      cardboard: 0.9,
      plastic: 2.2,
      glass: 0.7,
      metal: 1.6,
      corrugated: 0.85,
      mixed: 1.5,
      other: 1.2,
    }
    const matKey = materialType ? (activityIdToMaterialKey[materialType] ?? materialType) : ""
    const pkgKey = packagingType ? (activityIdToPackagingKey[packagingType] ?? packagingType) : ""
    let baseMultiplier = 2
    if (scope === "material" && matKey && materialMultipliers[matKey] !== undefined) {
      baseMultiplier = materialMultipliers[matKey]
    } else if (scope === "packaging" && pkgKey && packagingMultipliers[pkgKey] !== undefined) {
      baseMultiplier = packagingMultipliers[pkgKey]
    } else if (scope === "combination") {
      const mat = matKey && materialMultipliers[matKey] !== undefined ? materialMultipliers[matKey] : 2
      const pkg = pkgKey && packagingMultipliers[pkgKey] !== undefined ? packagingMultipliers[pkgKey] : 1.2
      baseMultiplier = mat * 0.5 + pkg * 0.3 + 1.2 * 0.2
    }
    const stubCo2e = Math.round(weightKg * baseMultiplier * 100) / 100
    const breakdown =
      scope === "combination"
        ? {
            material: Math.round(stubCo2e * 0.4 * 100) / 100,
            transport: Math.round(stubCo2e * 0.4 * 100) / 100,
            packaging: Math.round(stubCo2e * 0.2 * 100) / 100,
          }
        : undefined

    return NextResponse.json({
      co2e: stubCo2e,
      co2e_unit: "kg",
      breakdown,
    })
  } catch (err) {
    console.error("[CO2 calculate] Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Serverfehler" },
      { status: 500 }
    )
  }
}
