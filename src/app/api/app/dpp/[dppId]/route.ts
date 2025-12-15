export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/dpp/[dppId]
 * 
 * Holt einen DPP mit Medien
 */
export async function GET(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Zugriff
    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!dpp || dpp.organization.memberships.length === 0) {
      return NextResponse.json(
        { error: "DPP nicht gefunden oder kein Zugriff" },
        { status: 404 }
      )
    }

    // Lade DPP mit Medien
    const dppWithMedia = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: true,
        media: {
          orderBy: { uploadedAt: "desc" }
        }
      }
    })

    return NextResponse.json({ dpp: dppWithMedia }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching DPP:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/dpp/[dppId]
 * 
 * Aktualisiert einen DPP
 */
export async function PUT(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Zugriff
    const accessCheck = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!accessCheck || accessCheck.organization.memberships.length === 0) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diesen DPP" },
        { status: 403 }
      )
    }

    const {
      name, description, category,
      sku, gtin, brand, countryOfOrigin,
      materials, materialSource,
      careInstructions, isRepairable, sparePartsAvailable, lifespan,
      conformityDeclaration, disposalInfo,
      takebackOffered, takebackContact, secondLifeInfo
    } = await request.json()

    // Validierung (Pflichtfelder)
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Produktname ist erforderlich" },
        { status: 400 }
      )
    }

    if (!category || !["TEXTILE", "FURNITURE", "OTHER"].includes(category)) {
      return NextResponse.json(
        { error: "Produktkategorie ist erforderlich" },
        { status: 400 }
      )
    }

    if (!sku || typeof sku !== "string" || sku.trim().length === 0) {
      return NextResponse.json(
        { error: "SKU / Interne ID ist erforderlich" },
        { status: 400 }
      )
    }

    if (!brand || typeof brand !== "string" || brand.trim().length === 0) {
      return NextResponse.json(
        { error: "Marke / Hersteller ist erforderlich" },
        { status: 400 }
      )
    }

    if (!countryOfOrigin || typeof countryOfOrigin !== "string" || countryOfOrigin.trim().length === 0) {
      return NextResponse.json(
        { error: "Herstellungsland ist erforderlich" },
        { status: 400 }
      )
    }

    // DPP aktualisieren
    const dpp = await prisma.dpp.update({
      where: { id: params.dppId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category as "TEXTILE" | "FURNITURE" | "OTHER",
        sku: sku.trim(),
        gtin: gtin?.trim() || null,
        brand: brand.trim(),
        countryOfOrigin: countryOfOrigin.trim(),
        materials: materials?.trim() || null,
        materialSource: materialSource?.trim() || null,
        careInstructions: careInstructions?.trim() || null,
        isRepairable: isRepairable || null,
        sparePartsAvailable: sparePartsAvailable || null,
        lifespan: lifespan?.trim() || null,
        conformityDeclaration: conformityDeclaration?.trim() || null,
        disposalInfo: disposalInfo?.trim() || null,
        takebackOffered: takebackOffered || null,
        takebackContact: takebackContact?.trim() || null,
        secondLifeInfo: secondLifeInfo?.trim() || null
      }
    })

    return NextResponse.json(
      {
        message: "DPP erfolgreich aktualisiert",
        dpp
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating DPP:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

