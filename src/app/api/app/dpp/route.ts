export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasOrganizationAccess } from "@/lib/dpp-access"

/**
 * POST /api/app/dpp
 * 
 * Erstellt einen neuen DPP
 * - Prüft Berechtigung (User muss Mitglied der Organization sein)
 * - Erstellt DPP in DB
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const {
      name, description, category, organizationId,
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

    if (!organizationId || typeof organizationId !== "string") {
      return NextResponse.json(
        { error: "Organisation ist erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob User Mitglied der Organization ist
    const hasAccess = await hasOrganizationAccess(organizationId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Organisation" },
        { status: 403 }
      )
    }

    // DPP erstellen
    const dpp = await prisma.dpp.create({
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
        secondLifeInfo: secondLifeInfo?.trim() || null,
        status: "DRAFT",
        organizationId
      },
      include: {
        organization: true
      }
    })

    return NextResponse.json(
      {
        message: "DPP erfolgreich erstellt",
        dpp: {
          id: dpp.id,
          name: dpp.name,
          description: dpp.description,
          organizationId: dpp.organizationId,
          createdAt: dpp.createdAt
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating DPP:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/app/dpp
 * 
 * Holt alle DPPs der Organizations, in denen der User Mitglied ist
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

    // Hole alle Organizations des Users
    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        organization: {
          include: {
            dpps: {
              include: {
                media: {
                  select: {
                    id: true
                  }
                }
              },
              orderBy: {
                updatedAt: "desc"
              }
            }
          }
        }
      }
    })

    // Sammle alle DPPs
    const dpps = memberships.flatMap(m => 
      m.organization.dpps.map(dpp => ({
        id: dpp.id,
        name: dpp.name,
        description: dpp.description,
        organizationId: dpp.organizationId,
        organizationName: m.organization.name,
        mediaCount: dpp.media.length,
        createdAt: dpp.createdAt,
        updatedAt: dpp.updatedAt
      }))
    )

    return NextResponse.json({ dpps }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching DPPs:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

