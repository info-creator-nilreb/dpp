export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ORGANIZATION_ROLES, getOrganizationRole } from "@/lib/permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { checkTestPhaseBlock } from "@/lib/capabilities/resolver"
import { latestPublishedTemplate, hasPublishedTemplate, normalizeCategory } from "@/lib/template-helpers"

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

    // Explizite Validierung: session.user.id muss existieren
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Hole zuerst die Organisation des Users
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Wenn keine Organisation vorhanden → 400 mit klarem Fehler
    if (!membership || !membership.organization) {
      return NextResponse.json(
        { error: "NO_ORGANIZATION" },
        { status: 400 }
      )
    }

    // Prüfe ob User DPPs erstellen darf (ORG_VIEWER darf keine erstellen)
    const membershipRole = membership.role as string
    if (membershipRole === ORGANIZATION_ROLES.ORG_VIEWER) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Erstellen von DPPs" },
        { status: 403 }
      )
    }

    const resolvedOrganizationId = membership.organization.id
    console.log("DPP CREATE: resolved organizationId", resolvedOrganizationId)

    // Prüfe Testphase-Block: Kein Erstellen neuer DPPs wenn bereits veröffentlichte DPPs existieren
    const testPhaseBlock = await checkTestPhaseBlock("createDPP", {
      organizationId: resolvedOrganizationId,
      userId: session.user.id
    })
    
    if (testPhaseBlock.blocked) {
      return NextResponse.json(
        { 
          error: testPhaseBlock.reason || "Diese Aktion ist während der Testphase nicht möglich.",
          testPhaseBlocked: true
        },
        { status: 403 }
      )
    }

    const requestBody = await request.json()
    const {
      name, description, category, organizationId,
      sku, gtin, brand, countryOfOrigin,
      materials, materialSource,
      careInstructions, isRepairable, sparePartsAvailable, lifespan,
      conformityDeclaration, disposalInfo,
      takebackOffered, takebackContact, secondLifeInfo,
      templateId,
      fieldValues, // Template-basierte Feldwerte (optional)
      fieldInstances // Wiederholbare Feld-Instanzen (optional)
    } = requestBody

    // Validierung (Pflichtfelder)
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Produktname ist erforderlich" },
        { status: 400 }
      )
    }

    console.log("[DPP Create] ===== START =====")
    console.log("[DPP Create] Erhaltene Kategorie:", category, "Type:", typeof category)
    
    // Prüfe ob eine veröffentlichte Template für diese Kategorie existiert
    // (keine hart codierte Kategorie-Prüfung - nur Templates aus DB zählen)
    const hasTemplate = await hasPublishedTemplate(category)
    console.log("[DPP Create] Hat Template für Kategorie:", hasTemplate)
    
    if (!hasTemplate) {
      // Versuche auch mit normalisierter Kategorie
      const normalizedCategory = normalizeCategory(category)
      console.log("[DPP Create] Versuche normalisierte Kategorie:", normalizedCategory)
      const hasTemplateNormalized = normalizedCategory && normalizedCategory !== category 
        ? await hasPublishedTemplate(normalizedCategory)
        : false
      
      if (!hasTemplateNormalized) {
        return NextResponse.json(
          { error: `Kein veröffentlichtes Template für die Kategorie "${category}" gefunden. Bitte kontaktieren Sie einen Administrator.` },
          { status: 400 }
        )
      }
    }

    // Template-Validierung: templateId ist erforderlich
    let validatedTemplate
    if (templateId) {
      // Wenn templateId angegeben ist, validiere es
      // Suche mit normalisierter Kategorie (unterstützt deutsche/englische Namen)
      validatedTemplate = await prisma.template.findFirst({
        where: {
          id: templateId,
          status: "active"
        }
      })

      if (!validatedTemplate) {
        return NextResponse.json(
          { error: "Ungültiges oder nicht veröffentlichtes Template" },
          { status: 400 }
        )
      }
      
      // Prüfe ob Template-Kategorie zur DPP-Kategorie passt (mit Normalisierung)
      const normalizedTemplateCategory = normalizeCategory(validatedTemplate.category)
      const normalizedDppCategory = normalizeCategory(category)
      
      console.log("[DPP Create] Kategorie-Vergleich:")
      console.log("[DPP Create]   - Template-Kategorie:", validatedTemplate.category, "-> normalisiert:", normalizedTemplateCategory)
      console.log("[DPP Create]   - DPP-Kategorie:", category, "-> normalisiert:", normalizedDppCategory)
      
      if (normalizedTemplateCategory !== normalizedDppCategory) {
        return NextResponse.json(
          { error: `Template-Kategorie "${validatedTemplate.category}" passt nicht zur DPP-Kategorie "${category}"` },
          { status: 400 }
        )
      }
    } else {
      // Fallback: Lade das neueste veröffentlichte Template für die Kategorie
      // Versuche zuerst mit der originalen Kategorie, dann mit normalisierter
      validatedTemplate = await latestPublishedTemplate(category)
      
      if (!validatedTemplate) {
        const normalizedCategory = normalizeCategory(category)
        if (normalizedCategory && normalizedCategory !== category) {
          console.log("[DPP Create] Versuche Template-Suche mit normalisierter Kategorie:", normalizedCategory)
          validatedTemplate = await latestPublishedTemplate(normalizedCategory)
        }
      }
      
      if (!validatedTemplate) {
        return NextResponse.json(
          { error: `Kein veröffentlichtes Template für die Kategorie "${category}" gefunden` },
          { status: 400 }
        )
      }
      
      console.log("[DPP Create] Template gefunden:", { id: validatedTemplate.id, name: validatedTemplate.name, category: validatedTemplate.category })
    }

    // Validierung basierend auf Template-Definition (nur required fields prüfen)
    // Lade Template mit Feldern, um required flags zu prüfen
    const templateWithFields = await prisma.template.findFirst({
      where: {
        id: validatedTemplate.id,
        status: "active"
      },
      include: {
        blocks: {
          include: {
            fields: {
              where: {
                deprecatedInVersion: null // Nur aktive Felder
              }
            }
          }
        }
      }
    })

    // Map DPP-Feldnamen zu Template-Keys (reverse mapping)
    const dppFieldToTemplateKey: Record<string, string[]> = {
      "name": ["name", "produktname", "productname"],
      "description": ["description", "beschreibung"],
      "sku": ["sku"],
      "gtin": ["gtin", "ean"],
      "brand": ["brand", "marke", "hersteller"],
      "countryOfOrigin": ["countryOfOrigin", "herstellungsland", "country"],
      "materials": ["materials", "material", "materialien"],
      "materialSource": ["materialSource", "materialquelle", "datenquelle"],
      "careInstructions": ["careInstructions", "pflegehinweise", "pflege"],
      "isRepairable": ["isRepairable", "reparierbarkeit", "reparierbar"],
      "sparePartsAvailable": ["sparePartsAvailable", "ersatzteile"],
      "lifespan": ["lifespan", "lebensdauer"],
      "conformityDeclaration": ["conformityDeclaration", "konformiataetserklaerung", "konformität"],
      "disposalInfo": ["disposalInfo", "entsorgung"],
      "takebackOffered": ["takebackOffered", "ruecknahme_angeboten", "rücknahme"],
      "takebackContact": ["takebackContact", "ruecknahme_kontakt"],
      "secondLifeInfo": ["secondLifeInfo", "secondlife"]
    }

    // Validiere nur required fields aus dem Template
    if (templateWithFields) {
      const requiredFieldKeys = new Set<string>()
      templateWithFields.blocks.forEach(block => {
        block.fields.forEach(field => {
          if (field.required && field.deprecatedInVersion === null) {
            requiredFieldKeys.add(field.key.toLowerCase())
          }
        })
      })

      // Prüfe jedes required Template-Feld
      for (const [dppFieldName, templateKeyVariants] of Object.entries(dppFieldToTemplateKey)) {
        // Prüfe ob einer der Template-Keys required ist
        const isRequired = templateKeyVariants.some(key => requiredFieldKeys.has(key.toLowerCase()))
        
        if (isRequired) {
          // Prüfe zuerst, ob es ein repeatable field ist (in fieldInstances)
          let hasValue = false
          let fieldValue: string | null | undefined
          
          // 1. Prüfe fieldInstances (wiederholbare Felder)
          if (fieldInstances && typeof fieldInstances === "object") {
            for (const [templateKey, instances] of Object.entries(fieldInstances)) {
              const normalizedTemplateKey = templateKey.toLowerCase()
              if (templateKeyVariants.some(variant => variant.toLowerCase() === normalizedTemplateKey)) {
                // Prüfe ob mindestens eine Instanz einen Wert hat
                if (Array.isArray(instances) && instances.length > 0) {
                  for (const instance of instances) {
                    if (instance && typeof instance === "object" && instance.values) {
                      const instanceValue = instance.values[templateKey]
                      if (instanceValue !== null && instanceValue !== undefined) {
                        const stringValue = Array.isArray(instanceValue) ? instanceValue.join(", ") : String(instanceValue)
                        if (stringValue.trim()) {
                          hasValue = true
                          fieldValue = stringValue.trim()
                          break
                        }
                      }
                    }
                  }
                  if (hasValue) break
                }
              }
            }
          }
          
          // 2. Prüfe fieldValues (normale Template-Felder)
          if (!hasValue && fieldValues && typeof fieldValues === "object") {
            for (const [templateKey, value] of Object.entries(fieldValues)) {
              const normalizedTemplateKey = templateKey.toLowerCase()
              if (templateKeyVariants.some(variant => variant.toLowerCase() === normalizedTemplateKey)) {
                if (value !== null && value !== undefined) {
                  fieldValue = Array.isArray(value) ? value.join(", ") : String(value)
                  if (fieldValue.trim()) {
                    hasValue = true
                    break
                  }
                }
              }
            }
          }
          
          // 3. Fallback: Direkte Request-Felder
          if (!hasValue) {
            switch (dppFieldName) {
              case "name": fieldValue = name; break
              case "description": fieldValue = description; break
              case "sku": fieldValue = sku; break
              case "gtin": fieldValue = gtin; break
              case "brand": fieldValue = brand; break
              case "countryOfOrigin": fieldValue = countryOfOrigin; break
              case "materials": fieldValue = materials; break
              case "materialSource": fieldValue = materialSource; break
              case "careInstructions": fieldValue = careInstructions; break
              case "isRepairable": fieldValue = isRepairable; break
              case "sparePartsAvailable": fieldValue = sparePartsAvailable; break
              case "lifespan": fieldValue = lifespan; break
              case "conformityDeclaration": fieldValue = conformityDeclaration; break
              case "disposalInfo": fieldValue = disposalInfo; break
              case "takebackOffered": fieldValue = takebackOffered; break
              case "takebackContact": fieldValue = takebackContact; break
              case "secondLifeInfo": fieldValue = secondLifeInfo; break
              default: fieldValue = undefined
            }
            hasValue = fieldValue !== null && fieldValue !== undefined && typeof fieldValue === "string" && fieldValue.trim().length > 0
          }

          // Validiere required field
          if (!hasValue) {
            // Finde das erste matching Template-Feld für die Fehlermeldung
            const matchingField = templateWithFields.blocks
              .flatMap(block => block.fields)
              .find(field => 
                field.required && 
                templateKeyVariants.includes(field.key.toLowerCase())
              )
            
            const fieldLabel = matchingField?.label || dppFieldName
            return NextResponse.json(
              { error: `${fieldLabel} ist erforderlich` },
              { status: 400 }
            )
          }
        }
      }
    } else {
      // Fallback: Wenn Template nicht geladen werden kann, nur name validieren
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Produktname ist erforderlich" },
          { status: 400 }
        )
      }
    }

    // Verwende die aufgelöste organizationId (ignoriere organizationId aus Request, falls vorhanden)
    // organizationId wird explizit gesetzt

    // Normalisiere die Kategorie für die DPP-Erstellung (verwende Template-Kategorie als Quelle der Wahrheit)
    const normalizedCategory = normalizeCategory(validatedTemplate.category) || validatedTemplate.category
    
    console.log("[DPP Create] Kategorie-Normalisierung:")
    console.log("[DPP Create]   - Original Kategorie:", category)
    console.log("[DPP Create]   - Template-Kategorie:", validatedTemplate.category)
    console.log("[DPP Create]   - Normalisierte Kategorie:", normalizedCategory)
    
    // DPP erstellen - organizationId wird explizit gesetzt
    // Template-Version-Binding: Speichere templateId (logical) und templateVersionId (specific Template.id)
    const dpp = await prisma.dpp.create({
      data: {
        name: (name && typeof name === "string") ? name.trim() : "",
        description: (description && typeof description === "string") ? description.trim() : null,
        category: normalizedCategory as "TEXTILE" | "FURNITURE" | "OTHER",
        sku: (sku && typeof sku === "string") ? sku.trim() : "",
        gtin: (gtin && typeof gtin === "string") ? gtin.trim() : null,
        brand: (brand && typeof brand === "string") ? brand.trim() : "",
        countryOfOrigin: (countryOfOrigin && typeof countryOfOrigin === "string") ? countryOfOrigin.trim() : "",
        materials: (materials && typeof materials === "string") ? materials.trim() : null,
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
        organizationId: resolvedOrganizationId, // Explizit gesetzt
        // Template-Version-Binding (immutable nach Erstellung)
        templateId: normalizedCategory, // Logical identifier (category-based)
        templateVersionId: validatedTemplate.id // Specific version identifier (Template.id)
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log("DPP CREATED", dpp.id)

    // Audit Log: DPP erstellt
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, resolvedOrganizationId)
    
    await logDppAction(ACTION_TYPES.CREATE, dpp.id, {
      actorId: session.user.id,
      actorRole: role || undefined,
      organizationId: resolvedOrganizationId,
      source: SOURCES.UI,
      complianceRelevant: true, // DPP-Erstellung ist compliance-relevant
      ipAddress,
    })

    return NextResponse.json(
      {
        message: "DPP erfolgreich erstellt",
        dpp: {
          id: dpp.id,
          name: dpp.name
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating DPP:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
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

    // Prüfe ob Super Admin (kann alle DPPs sehen)
    const { isSuperAdmin } = await import("@/lib/permissions")
    const isAdmin = await isSuperAdmin(session.user.id)

    if (isAdmin) {
      // Super Admin sieht alle DPPs
      const allDpps = await prisma.dpp.findMany({
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          media: {
            select: { id: true }
          }
        },
        orderBy: { updatedAt: "desc" }
      })

      const dpps = allDpps.map(dpp => ({
        id: dpp.id,
        name: dpp.name,
        description: dpp.description,
        organizationId: dpp.organizationId,
        organizationName: dpp.organization.name,
        mediaCount: dpp.media.length,
        createdAt: dpp.createdAt,
        updatedAt: dpp.updatedAt
      }))

      return NextResponse.json({ dpps }, { status: 200 })
    }

    // Normale User: Hole alle Organizations des Users
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

    // Sammle alle DPPs aus Organizations
    const orgDpps = memberships.flatMap(m => 
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

    // Hole auch DPPs, auf die User externe Permissions hat (die nicht bereits in orgDpps sind)
    const orgDppIds = new Set(orgDpps.map(d => d.id))
    
    const externalPermissions = await prisma.dppPermission.findMany({
      where: { userId: session.user.id },
      include: {
        dpp: {
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            },
            media: { select: { id: true } }
          }
        }
      }
    })

    // Filtere DPPs mit externen Permissions (die nicht bereits in orgDpps sind)
    const { canViewDPP } = await import("@/lib/permissions")
    const externalDpps = await Promise.all(
      externalPermissions
        .filter(perm => !orgDppIds.has(perm.dppId))
        .map(async perm => {
          const canView = await canViewDPP(session.user.id, perm.dpp.id)
          if (!canView) return null
          return {
            id: perm.dpp.id,
            name: perm.dpp.name,
            description: perm.dpp.description,
            organizationId: perm.dpp.organizationId,
            organizationName: perm.dpp.organization.name,
            mediaCount: perm.dpp.media.length,
            createdAt: perm.dpp.createdAt,
            updatedAt: perm.dpp.updatedAt
          }
        })
    )

    const externalDppsFiltered = externalDpps.filter((dpp): dpp is NonNullable<typeof dpp> => dpp !== null)

    // Kombiniere beide Listen
    const dpps = [...orgDpps, ...externalDppsFiltered]

    return NextResponse.json({ dpps }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching DPPs:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

