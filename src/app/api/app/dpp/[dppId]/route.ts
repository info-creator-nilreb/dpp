export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP, requireEditDPP } from "@/lib/api-permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { getOrganizationRole } from "@/lib/permissions"

/**
 * GET /api/app/dpp/[dppId]
 * 
 * Holt einen DPP mit Medien
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Berechtigung mit neuem Permission-System
    const permissionError = await requireViewDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) {
      console.error("Permission check failed:", resolvedParams.dppId, session.user.id)
      return permissionError
    }

    // Lade DPP mit Medien
    console.log("Loading DPP:", resolvedParams.dppId)
    const dppWithMedia = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        media: {
          orderBy: { uploadedAt: "desc" }
        }
      }
    })
    console.log("DPP loaded:", dppWithMedia ? "found" : "not found")

    if (!dppWithMedia) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Feldwerte für Pflichtdaten-Tab: Fallback aus DPP-Direktfeldern (technical keys)
    const fieldValuesFromDpp: Record<string, string> = {
      name: dppWithMedia.name ?? "",
      description: dppWithMedia.description ?? "",
      sku: dppWithMedia.sku ?? "",
      gtin: dppWithMedia.gtin ?? "",
      brand: dppWithMedia.brand ?? "",
      countryOfOrigin: dppWithMedia.countryOfOrigin ?? "",
      materials: dppWithMedia.materials ?? "",
      materialSource: dppWithMedia.materialSource ?? "",
      careInstructions: dppWithMedia.careInstructions ?? "",
      isRepairable: dppWithMedia.isRepairable ?? "",
      sparePartsAvailable: dppWithMedia.sparePartsAvailable ?? "",
      lifespan: dppWithMedia.lifespan ?? "",
      conformityDeclaration: dppWithMedia.conformityDeclaration ?? "",
      disposalInfo: dppWithMedia.disposalInfo ?? "",
      takebackOffered: dppWithMedia.takebackOffered ?? "",
      takebackContact: dppWithMedia.takebackContact ?? "",
      secondLifeInfo: dppWithMedia.secondLifeInfo ?? "",
    }
    let fieldValues: Record<string, string> = {}
    for (const [k, v] of Object.entries(fieldValuesFromDpp)) {
      if (v != null && String(v).trim() !== "") fieldValues[k] = String(v).trim()
    }
    let fieldInstances: Record<string, unknown[]> = {}

    const draftContent = await prisma.dppContent.findFirst({
      where: { dppId: resolvedParams.dppId, isPublished: false },
      orderBy: { updatedAt: "desc" }
    })
    if (draftContent?.fieldValues && typeof draftContent.fieldValues === "object") {
      const fromContent = draftContent.fieldValues as Record<string, string | string[]>
      fieldValues = { ...fieldValues, ...fromContent } as Record<string, string>
    }
    if (draftContent?.fieldInstances && typeof draftContent.fieldInstances === "object") {
      fieldInstances = draftContent.fieldInstances as Record<string, unknown[]>
    }

    return NextResponse.json({
      dpp: dppWithMedia,
      fieldValues,
      fieldInstances,
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching DPP:", error)
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
    return NextResponse.json(
      { error: errorMessage },
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
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Berechtigung mit neuem Permission-System
    const permissionError = await requireEditDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    // Lade existierenden DPP, um Status zu prüfen
    const existingDpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      select: { status: true, category: true }
    })

    if (!existingDpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
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

    // ESPR Guardrail: Kategorie ist unveränderbar ab Veröffentlichung
    if (existingDpp.status === "PUBLISHED" && category && category !== existingDpp.category) {
      return NextResponse.json(
        { 
          error: "Die Kategorie eines veröffentlichten DPPs kann nicht geändert werden. Bitte erstellen Sie einen neuen DPP mit der korrekten Kategorie und setzen Sie diesen DPP auf 'deprecated'.",
          code: "CATEGORY_IMMUTABLE_AFTER_PUBLISH"
        },
        { status: 403 }
      )
    }

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

    // Lade DPP für Audit-Log (alte Werte)
    const oldDpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      select: {
        organizationId: true,
        name: true,
        description: true,
        category: true,
        sku: true,
        gtin: true,
        brand: true,
        countryOfOrigin: true,
        materials: true,
        materialSource: true,
        careInstructions: true,
        isRepairable: true,
        sparePartsAvailable: true,
        lifespan: true,
        conformityDeclaration: true,
        disposalInfo: true,
        takebackOffered: true,
        takebackContact: true,
        secondLifeInfo: true
      }
    })

    if (!oldDpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // DPP aktualisieren
    const dpp = await prisma.dpp.update({
      where: { id: resolvedParams.dppId },
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

    // Audit Log: DPP aktualisiert
    // Logge nur geänderte Felder
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, oldDpp.organizationId)
    
    // Compliance-relevante Felder
    const complianceRelevantFields = [
      "materials",
      "materialSource",
      "conformityDeclaration",
      "disposalInfo",
      "countryOfOrigin"
    ]

    // Logge alle geänderten Felder
    const fieldsToCheck = [
      "name", "description", "category", "sku", "gtin", "brand",
      "countryOfOrigin", "materials", "materialSource", "careInstructions",
      "isRepairable", "sparePartsAvailable", "lifespan",
      "conformityDeclaration", "disposalInfo", "takebackOffered",
      "takebackContact", "secondLifeInfo"
    ]

    for (const field of fieldsToCheck) {
      const oldValue = (oldDpp as any)[field]
      const newValue = (dpp as any)[field]
      
      // Nur loggen wenn sich der Wert geändert hat
      if (oldValue !== newValue) {
        await logDppAction(ACTION_TYPES.UPDATE, resolvedParams.dppId, {
          actorId: session.user.id,
          actorRole: role || undefined,
          organizationId: oldDpp.organizationId,
          fieldName: field,
          oldValue,
          newValue,
          source: SOURCES.UI,
          complianceRelevant: complianceRelevantFields.includes(field),
          ipAddress,
        })
      }
    }

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

