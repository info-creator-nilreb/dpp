import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP, requireEditDPP } from "@/lib/api-permissions"
import { latestPublishedTemplate } from "@/lib/template-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/app/dpp/[dppId]/content
 *
 * Liefert CMS-Inhalt (Blocks, Styling) für den Mehrwert-Tab.
 * Immer nur Entwurf (isPublished: false) – auch bei veröffentlichten DPPs.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireViewDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    const dppContent = await prisma.dppContent.findFirst({
      where: { dppId, isPublished: false },
      orderBy: { updatedAt: "desc" },
      select: { blocks: true, styling: true },
    })

    const blocks = Array.isArray(dppContent?.blocks) ? dppContent.blocks : []
    const styling = dppContent?.styling ?? null

    return NextResponse.json({ content: { blocks, styling } })
  } catch (error) {
    console.error("[DPP Content API] GET error:", error)
    return NextResponse.json(
      { error: (error as Error)?.message || "Fehler beim Laden des Inhalts" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/app/dpp/[dppId]/content
 *
 * Speichert CMS-Blöcke (Autosave aus Mehrwert-Tab). Body: { blocks: Block[], styling?: unknown }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    const body = await request.json().catch(() => ({})) as { blocks?: unknown[]; styling?: unknown }
    const blocks = Array.isArray(body.blocks) ? body.blocks : []
    const styling = body.styling ?? undefined

    const existingContent = await prisma.dppContent.findFirst({
      where: { dppId, isPublished: false },
      orderBy: { updatedAt: "desc" },
    })

    const updatedAt = new Date()

    if (existingContent) {
      await prisma.dppContent.update({
        where: { id: existingContent.id },
        data: {
          blocks: blocks as unknown as Prisma.InputJsonValue,
          ...(styling !== undefined && { styling: styling as unknown as Prisma.InputJsonValue }),
          updatedAt,
        },
      })
    } else {
      await prisma.dppContent.create({
        data: {
          dppId,
          blocks: blocks as unknown as Prisma.InputJsonValue,
          ...(styling !== undefined && { styling: styling as unknown as Prisma.InputJsonValue }),
          isPublished: false,
          createdBy: session.user.id,
          updatedAt,
        },
      })
    }

    // Damit "Zuletzt gespeichert" nach Neuladen stimmt: Dpp.updatedAt mitschreiben
    await prisma.dpp.update({
      where: { id: dppId },
      data: { updatedAt },
    })

    return NextResponse.json({ updatedAt: updatedAt.toISOString() })
  } catch (error) {
    console.error("[DPP Content API] POST error:", error)
    return NextResponse.json(
      { error: (error as Error)?.message || "Fehler beim Speichern" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/dpp/[dppId]/content
 *
 * Speichert template-basierte Feldwerte in dppContent (immer Entwurf, isPublished: false).
 * Bei veröffentlichten DPPs: Bearbeitungen landen im Entwurf; erneutes Veröffentlichen erzeugt eine neue Version.
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

    // Prüfe Berechtigung
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    const { fieldValues, fieldInstances } = await request.json()

    console.log("[DPP Content API] Saving content for DPP:", dppId)
    console.log("[DPP Content API] Field values:", Object.keys(fieldValues || {}).length, "fields:", Object.keys(fieldValues || {}))
    console.log("[DPP Content API] Field instances:", Object.keys(fieldInstances || {}).length, "repeatable fields:", Object.keys(fieldInstances || {}))

    // Lade Template, um Block-Struktur zu erhalten
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      select: { category: true }
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    const template = await latestPublishedTemplate(dpp.category)

    if (!template) {
      return NextResponse.json(
        { error: `Kein Template für die Kategorie "${dpp.category}" gefunden` },
        { status: 404 }
      )
    }

    // Erstelle Block-Struktur mit Feldwerten
    const templateBlocks = template.blocks.map(block => {
      const blockData: Record<string, any> = {}

      // Sammle normale Feldwerte für diesen Block
      block.fields.forEach(field => {
        if (!field.isRepeatable) {
          // Normales Feld
          // WICHTIG: Prüfe zuerst Template-Key, dann englischen Key (für Kompatibilität)
          if (fieldValues && (fieldValues[field.key] !== undefined || fieldValues[field.key] !== null)) {
            blockData[field.key] = fieldValues[field.key]
            console.log(`[DPP Content API] Block ${block.name}: Field ${field.key} (${field.label}) = ${fieldValues[field.key]}`)
          } else {
            // Versuche englischen Key (für alte DPPs mit englischen Keys)
            const englishKeyMapping: Record<string, string> = {
              "produktname": "name",
              "beschreibung": "description",
              "herstellungsland": "countryOfOrigin",
              "ean": "gtin"
            }
            const englishKey = englishKeyMapping[field.key.toLowerCase()] || field.key
            if (fieldValues && fieldValues[englishKey] !== undefined && fieldValues[englishKey] !== null) {
              blockData[field.key] = fieldValues[englishKey]
              console.log(`[DPP Content API] Block ${block.name}: Field ${field.key} (${field.label}) mapped from english key "${englishKey}" = ${fieldValues[englishKey]}`)
            }
          }
        } else {
          // Wiederholbares Feld
          if (fieldInstances && fieldInstances[field.key]) {
            blockData[field.key] = fieldInstances[field.key]
            console.log(`[DPP Content API] Block ${block.name}: Repeatable field ${field.key} (${field.label}) =`, fieldInstances[field.key].length, "instances")
          }
        }
      })

      return {
        id: block.id,
        type: "template_block",
        order: block.order,
        data: blockData
      }
    })

    // Lade oder erstelle DppContent
    let dppContent = await prisma.dppContent.findFirst({
      where: {
        dppId,
        isPublished: false
      }
    })

    let finalBlocks: any[] = []

    if (dppContent) {
      // Lade bestehende Blöcke
      const existingBlocks = (dppContent.blocks as any) || []
      
      // Trenne CMS-Blöcke (mit content) und template-basierte Blöcke (mit data)
      const cmsBlocks = existingBlocks.filter((block: any) => 
        block.content && !block.data && block.type !== "template_block"
      )
      
      // Merge: CMS-Blöcke + template-basierte Blöcke
      // Template-Blöcke ersetzen bestehende template-basierte Blöcke mit gleicher ID
      const existingTemplateBlockIds = new Set(
        existingBlocks
          .filter((block: any) => block.type === "template_block" || block.data)
          .map((block: any) => block.id)
      )
      
      // Füge CMS-Blöcke hinzu
      finalBlocks = [...cmsBlocks]
      
      // Füge template-basierte Blöcke hinzu (ersetzen bestehende mit gleicher ID)
      templateBlocks.forEach(templateBlock => {
        const existingIndex = finalBlocks.findIndex(
          (b: any) => b.id === templateBlock.id && (b.type === "template_block" || b.data)
        )
        if (existingIndex >= 0) {
          // Ersetze bestehenden template-basierten Block
          finalBlocks[existingIndex] = templateBlock
        } else {
          // Füge neuen template-basierten Block hinzu
          finalBlocks.push(templateBlock)
        }
      })
      
      // Aktualisiere bestehenden DppContent
      await prisma.dppContent.update({
        where: { id: dppContent.id },
        data: {
          blocks: finalBlocks,
          updatedAt: new Date()
        }
      })
      console.log("[DPP Content API] Updated existing dppContent with", finalBlocks.length, "blocks (", cmsBlocks.length, "CMS,", templateBlocks.length, "template)")
    } else {
      // Erstelle neuen DppContent (nur template-basierte Blöcke)
      finalBlocks = templateBlocks
      await prisma.dppContent.create({
        data: {
          dppId,
          blocks: finalBlocks as unknown as Prisma.InputJsonValue,
          isPublished: false
        }
      })
      console.log("[DPP Content API] Created new dppContent with", finalBlocks.length, "template blocks")
    }

    // DPP-Spalten (gtin, sku, name, …) aus fieldValues synchronisieren – gelöschte Werte werden in der DB entfernt (datensparsam)
    const columnToFieldKeys: Record<string, string[]> = {
      name: ["name", "produktname", "productname"],
      description: ["description", "beschreibung"],
      sku: ["sku"],
      gtin: ["gtin", "ean"],
      brand: ["brand", "marke", "hersteller"],
      countryOfOrigin: ["countryOfOrigin", "herstellungsland", "country"],
      materials: ["materials", "material", "materialien"],
      materialSource: ["materialSource", "materialquelle"],
      careInstructions: ["careInstructions", "pflegehinweise", "pflege"],
      isRepairable: ["isRepairable", "reparierbarkeit", "reparierbar"],
      sparePartsAvailable: ["sparePartsAvailable", "ersatzteile"],
      lifespan: ["lifespan", "lebensdauer"],
      conformityDeclaration: ["conformityDeclaration", "konformiataetserklaerung"],
      disposalInfo: ["disposalInfo", "entsorgung"],
      takebackOffered: ["takebackOffered", "ruecknahme_angeboten", "rücknahme"],
      takebackContact: ["takebackContact", "ruecknahme_kontakt"],
      secondLifeInfo: ["secondLifeInfo", "secondlife"],
    }
    // Optionale DPP-Spalten: leerer String → null (Datensparsamkeit). name ist Pflichtfeld und bleibt String.
    const optionalColumns = new Set(["description", "sku", "gtin", "brand", "countryOfOrigin", "materials", "materialSource", "careInstructions", "isRepairable", "sparePartsAvailable", "lifespan", "conformityDeclaration", "disposalInfo", "takebackOffered", "takebackContact", "secondLifeInfo"])
    const dppUpdateFromFieldValues: Record<string, string | null> = {}
    for (const [col, keys] of Object.entries(columnToFieldKeys)) {
      let raw: unknown = undefined
      for (const k of keys) {
        if (fieldValues && typeof fieldValues === "object" && k in fieldValues) {
          raw = fieldValues[k]
          break
        }
      }
      if (raw === undefined) continue // Feld nicht gesendet → Spalte nicht überschreiben
      const value = raw === null ? "" : String(raw).trim()
      dppUpdateFromFieldValues[col] = optionalColumns.has(col) && value === "" ? null : value
    }
    if (Object.keys(dppUpdateFromFieldValues).length > 0) {
      await prisma.dpp.update({
        where: { id: dppId },
        data: dppUpdateFromFieldValues as any,
      })
      console.log("[DPP Content API] Synced DPP columns from fieldValues:", Object.keys(dppUpdateFromFieldValues))
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("[DPP Content API] Error saving content:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Speichern des Contents" },
      { status: 500 }
    )
  }
}

