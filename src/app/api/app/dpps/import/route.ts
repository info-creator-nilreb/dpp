import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ORGANIZATION_ROLES } from "@/lib/permissions"
import { hasFeature } from "@/lib/capabilities/resolver"
import { latestPublishedTemplate, normalizeCategory } from "@/lib/template-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/app/dpps/import
 * 
 * Importiert mehrere DPPs aus CSV-Daten
 * - Prüft Berechtigung (User muss Mitglied der Organization sein)
 * - Erstellt pro Produkt einen DPP als DRAFT
 * - Verwendet Prisma Transaktion für atomare Operation
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

    // Hole die Organisation des Users
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        organization: true
      }
    })

    if (!membership || !membership.organization) {
      return NextResponse.json(
        { error: "NO_ORGANIZATION" },
        { status: 400 }
      )
    }

    const resolvedOrganizationId = membership.organization.id

    // Feature-Check: CSV Import muss verfügbar sein
    const canUseCsvImport = await hasFeature("csv_import", {
      organizationId: resolvedOrganizationId,
      userId: session.user.id,
    })

    if (!canUseCsvImport) {
      return NextResponse.json(
        { error: "CSV-Import ist für Ihre Subscription nicht verfügbar" },
        { status: 403 }
      )
    }

    // Prüfe ob User DPPs erstellen darf (ORG_VIEWER darf keine erstellen)
    const role = membership.role as string
    if (role === ORGANIZATION_ROLES.ORG_VIEWER) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Erstellen von DPPs" },
        { status: 403 }
      )
    }

    const { products, templateId } = await request.json()

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Keine Produkte zum Importieren vorhanden" },
        { status: 400 }
      )
    }

    // Template-Validierung: templateId ist erforderlich
    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json(
        { error: "Template-ID ist erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob Template existiert und veröffentlicht ist
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        status: "active"
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: "Ungültiges oder nicht veröffentlichtes Template" },
        { status: 400 }
      )
    }

    // Validierung der Produkte
    const errors: string[] = []
    const normalizedTemplateCategory = normalizeCategory(template.category)
    
    products.forEach((product: any, index: number) => {
      if (!product.name || typeof product.name !== "string" || product.name.trim().length === 0) {
        errors.push(`Produkt ${index + 1}: Name ist erforderlich`)
      }
      // Kategorie muss mit Template-Kategorie übereinstimmen (mit Normalisierung)
      const normalizedProductCategory = normalizeCategory(product.category)
      if (!product.category || normalizedProductCategory !== normalizedTemplateCategory) {
        errors.push(`Produkt ${index + 1}: Kategorie muss "${template.category}" sein (entspricht dem ausgewählten Template)`)
      }
      if (!product.sku || typeof product.sku !== "string" || product.sku.trim().length === 0) {
        errors.push(`Produkt ${index + 1}: SKU ist erforderlich`)
      }
      if (!product.brand || typeof product.brand !== "string" || product.brand.trim().length === 0) {
        errors.push(`Produkt ${index + 1}: Marke ist erforderlich`)
      }
      if (!product.countryOfOrigin || typeof product.countryOfOrigin !== "string" || product.countryOfOrigin.trim().length === 0) {
        errors.push(`Produkt ${index + 1}: Herstellungsland ist erforderlich`)
      }
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: errors },
        { status: 400 }
      )
    }

    // Erstelle alle DPPs in einer Transaktion
    const createdIds: string[] = []

    await prisma.$transaction(async (tx) => {
      for (const product of products) {
        // Verwende die normalisierte Kategorie für die DPP-Erstellung
        const normalizedProductCategory = normalizeCategory(product.category) || product.category
        
        const dpp = await tx.dpp.create({
          data: {
            name: product.name.trim(),
            description: product.description?.trim() || null,
            category: normalizedProductCategory as "TEXTILE" | "FURNITURE" | "OTHER",
            sku: product.sku.trim(),
            brand: product.brand.trim(),
            countryOfOrigin: product.countryOfOrigin.trim(),
            status: "DRAFT",
            organizationId: resolvedOrganizationId
          }
        })
        createdIds.push(dpp.id)
      }
    })

    return NextResponse.json({
      success: true,
      createdIds,
      count: createdIds.length
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error importing DPPs:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten beim Import", details: error.message },
      { status: 500 }
    )
  }
}

