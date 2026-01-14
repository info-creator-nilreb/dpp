import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { latestPublishedTemplate } from "@/lib/template-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * PUT /api/app/dpp/[dppId]/content
 * 
 * Speichert template-basierte Feldwerte in dppContent
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

    // Prüfe Berechtigung
    const permissionError = await requireEditDPP(params.dppId, session.user.id)
    if (permissionError) return permissionError

    const { fieldValues, fieldInstances } = await request.json()

    console.log("[DPP Content API] Saving content for DPP:", params.dppId)
    console.log("[DPP Content API] Field values:", Object.keys(fieldValues || {}).length, "fields:", Object.keys(fieldValues || {}))
    console.log("[DPP Content API] Field instances:", Object.keys(fieldInstances || {}).length, "repeatable fields:", Object.keys(fieldInstances || {}))

    // Lade Template, um Block-Struktur zu erhalten
    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
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
        dppId: params.dppId,
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
          dppId: params.dppId,
          blocks: finalBlocks,
          isPublished: false
        }
      })
      console.log("[DPP Content API] Created new dppContent with", finalBlocks.length, "template blocks")
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
