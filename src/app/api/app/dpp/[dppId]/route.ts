export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP, requireEditDPP } from "@/lib/api-permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { getOrganizationRole } from "@/lib/permissions"
import { latestPublishedTemplate, normalizeCategory } from "@/lib/template-helpers"

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
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Berechtigung mit neuem Permission-System
    const permissionError = await requireViewDPP(dppId, session.user.id)
    if (permissionError) {
      console.error("Permission check failed:", dppId, session.user.id)
      return permissionError
    }

    // Lade DPP mit Medien und Content
    console.log("[DPP API] GET Request - Loading DPP:", dppId)
    const dppWithMedia = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        media: {
          orderBy: { uploadedAt: "desc" }
        },
        content: {
          where: {
            isPublished: false // Lade nur Draft-Content
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 1 // Neueste Draft-Version
        }
      }
    })

    if (!dppWithMedia) {
      console.log("[DPP API] DPP not found:", dppId)
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    console.log("[DPP API] DPP loaded successfully:", dppWithMedia.id)
    console.log("[DPP API] DPP has content entries:", dppWithMedia.content?.length || 0)

    // Extrahiere Feldwerte aus DppContent
    let fieldValues: Record<string, string | string[]> = {}
    let fieldInstances: Record<string, Array<{
      instanceId: string
      values: Record<string, string | string[]>
    }>> = {}

    if (dppWithMedia.content && dppWithMedia.content.length > 0) {
      const dppContent = dppWithMedia.content[0]
      const blocks = (dppContent.blocks as any) || []
      
      console.log("[DPP API] Found dppContent with", blocks.length, "blocks")
      console.log("[DPP API] DppContent blocks:", JSON.stringify(blocks, null, 2))
      
      blocks.forEach((block: any) => {
        console.log("[DPP API] Processing block:", block.id, "type:", block.type, "has data:", !!block.data, "has content:", !!block.content)
        
        // Nur template-basierte Blöcke haben block.data
        // CMS-Blöcke haben block.content, aber keine template-basierten Felder
        // Wir extrahieren nur Felder aus block.data (template-basierte Blöcke)
        if (!block.data || typeof block.data !== 'object') {
          // Kein template-basierter Block, überspringe
          console.log("[DPP API] Skipping block (no data):", block.id)
          return
        }
        
        console.log("[DPP API] Block data keys:", Object.keys(block.data))
        
        const blockData = block.data
        if (blockData && typeof blockData === 'object') {
          // Für normale Felder: Speichere direkt in fieldValues
          Object.keys(blockData).forEach(fieldKey => {
            const value = blockData[fieldKey]
            console.log("[DPP API] Processing field:", fieldKey, "value type:", typeof value, "isArray:", Array.isArray(value))
            
            // Prüfe ob es ein wiederholbares Feld ist (Array von Objekten mit instanceId)
            if (Array.isArray(value) && value.length > 0) {
              // Prüfe ob das erste Element ein Objekt mit instanceId ist
              const firstElement = value[0]
              if (typeof firstElement === 'object' && firstElement !== null && firstElement.instanceId) {
                // Wiederholbares Feld: Speichere in fieldInstances
                fieldInstances[fieldKey] = value
                console.log("[DPP API] Detected repeatable field:", fieldKey, "with", value.length, "instances")
              } else {
                // Normales Array-Feld (z.B. Multi-Select): Speichere direkt
                fieldValues[fieldKey] = value
                console.log("[DPP API] Detected array field (multi-select):", fieldKey)
              }
            } else if (value !== null && value !== undefined) {
              // Normales Feld: Speichere direkt
              fieldValues[fieldKey] = value
              console.log("[DPP API] Detected normal field:", fieldKey, "=", value)
            }
          })
        }
      })
      
      console.log("[DPP API] Extracted field values:", Object.keys(fieldValues).length, "fields:", Object.keys(fieldValues))
      console.log("[DPP API] Extracted field values detail:", JSON.stringify(fieldValues, null, 2))
      console.log("[DPP API] Extracted field instances:", Object.keys(fieldInstances).length, "repeatable fields:", Object.keys(fieldInstances))
    } else {
      console.log("[DPP API] No dppContent found for DPP:", dppId)
    }

    // FALLBACK: Ergänze fieldValues mit direkten DPP-Spalten, wenn sie noch nicht vorhanden sind
    // Dies ist für alte DPPs, die noch nicht alle Werte in template-basierten Feldern haben
    // WICHTIG: Ergänze nur, wenn Werte in DPP-Spalten vorhanden sind, aber nicht in fieldValues
    const directFieldMapping: Record<string, string> = {
      "name": "name",
      "description": "description",
      "sku": "sku",
      "gtin": "gtin",
      "brand": "brand",
      "countryOfOrigin": "countryOfOrigin",
      "materials": "materials",
      "materialSource": "materialSource",
      "careInstructions": "careInstructions",
      "isRepairable": "isRepairable",
      "sparePartsAvailable": "sparePartsAvailable",
      "lifespan": "lifespan",
      "conformityDeclaration": "conformityDeclaration",
      "disposalInfo": "disposalInfo",
      "takebackOffered": "takebackOffered",
      "takebackContact": "takebackContact",
      "secondLifeInfo": "secondLifeInfo"
    }

    // Ergänze fieldValues mit direkten DPP-Spalten, wenn sie noch nicht vorhanden sind
    Object.keys(directFieldMapping).forEach(dppColumn => {
      const fieldKey = directFieldMapping[dppColumn]
      const value = (dppWithMedia as any)[dppColumn]
      // Ergänze nur, wenn Wert vorhanden ist UND noch nicht in fieldValues
      if (value !== null && value !== undefined && value !== "" && !fieldValues[fieldKey]) {
        fieldValues[fieldKey] = value
        console.log("[DPP API] Fallback: Added", dppColumn, "->", fieldKey, "=", value)
      }
    })
    
    if (Object.keys(fieldValues).length > 0) {
      console.log("[DPP API] Final fieldValues after fallback:", Object.keys(fieldValues).length, "fields:", Object.keys(fieldValues))
    }

    return NextResponse.json({ 
      dpp: dppWithMedia,
      fieldValues,
      fieldInstances
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
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Berechtigung mit neuem Permission-System
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    // Lade existierenden DPP, um Status zu prüfen
    const existingDpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      select: { status: true, category: true }
    })

    if (!existingDpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    const requestBody = await request.json()
    const {
      name, description, category,
      sku, gtin, brand, countryOfOrigin,
      materials, materialSource,
      careInstructions, isRepairable, sparePartsAvailable, lifespan,
      conformityDeclaration, disposalInfo,
      takebackOffered, takebackContact, secondLifeInfo,
      templateId, templateVersionId, // Diese Felder werden explizit ignoriert (immutable)
      fieldValues, // Template-basierte Feldwerte (optional)
      fieldInstances // Wiederholbare Feld-Instanzen (optional)
    } = requestBody
    
    // Template-Version-Binding Guard: templateId und templateVersionId sind immutable
    // Verhindere explizite Änderungen dieser Felder
    if (templateId !== undefined || templateVersionId !== undefined) {
      console.warn("[DPP Update] Attempt to modify immutable template binding fields ignored")
    }

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

    // Template-basierte Validierung (wie in POST-Route)
    const normalizedCategory = normalizeCategory(category) || category
    const validatedTemplate = await latestPublishedTemplate(normalizedCategory)
    const templateWithFields = validatedTemplate ? await prisma.template.findUnique({
      where: { id: validatedTemplate.id },
      include: {
        blocks: {
          include: {
            fields: {
              where: { deprecatedInVersion: null },
              orderBy: { order: "asc" }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    }) : null

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

    // Lade DPP für Audit-Log (alte Werte)
    const oldDpp = await prisma.dpp.findUnique({
      where: { id: dppId },
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
      where: { id: dppId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category as "TEXTILE" | "FURNITURE" | "OTHER",
        sku: (sku && typeof sku === "string") ? sku.trim() : "",
        gtin: (gtin && typeof gtin === "string") ? gtin.trim() : null,
        brand: (brand && typeof brand === "string") ? brand.trim() : "",
        countryOfOrigin: (countryOfOrigin && typeof countryOfOrigin === "string") ? countryOfOrigin.trim() : "",
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
        await logDppAction(ACTION_TYPES.UPDATE, dppId, {
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

