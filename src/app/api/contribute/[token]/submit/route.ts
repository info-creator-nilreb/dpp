export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DPP_SECTIONS } from "@/lib/permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { createNotification } from "@/lib/phase1/notifications"
import { latestPublishedTemplate } from "@/lib/template-helpers"

/**
 * POST /api/contribute/[token]/submit
 * 
 * Reicht Daten für einen Contributor Token ein
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    const data = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Token ist erforderlich" },
        { status: 400 }
      )
    }

    // Hole Contributor Token
    const contributorToken = await prisma.contributorToken.findUnique({
      where: { token },
      include: {
        dpp: {
          include: {
            organization: {
              include: {
                memberships: {
                  where: {
                    role: {
                      in: ["ORG_OWNER", "ORG_ADMIN"],
                    },
                  },
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!contributorToken) {
      return NextResponse.json(
        { error: "Ungültiger Token" },
        { status: 404 }
      )
    }

    // Prüfe ob Token abgelaufen ist
    if (contributorToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token ist abgelaufen" },
        { status: 400 }
      )
    }

    // Prüfe ob bereits eingereicht
    if (contributorToken.status === "submitted") {
      return NextResponse.json(
        { error: "Data already submitted" },
        { status: 400 }
      )
    }

    // Prüfe Bestätigung/Ablehnung (abhängig vom Modus)
    if (contributorToken.supplierMode === "declaration") {
      // Prüf-Modus: Bestätigung ODER Ablehnung mit Kommentar erforderlich
      if (!data.confirmed && !data.rejected) {
        return NextResponse.json(
          { error: "Bitte bestätigen Sie die Angaben oder lehnen Sie diese mit Kommentar ab" },
          { status: 400 }
        )
      }
      if (data.rejected && (!data.reviewComment || !data.reviewComment.trim())) {
        return NextResponse.json(
          { error: "Bitte geben Sie einen Kommentar zur Ablehnung an" },
          { status: 400 }
        )
      }
    } else {
      // Beisteuern-Modus: Bestätigung erforderlich
      if (!data.confirmed) {
        return NextResponse.json(
          { error: "Bitte bestätigen Sie die Richtigkeit der Daten" },
          { status: 400 }
        )
      }
    }

    // Template-based: Speichere in DppContent
    if (contributorToken.blockIds) {
      const blockIds = contributorToken.blockIds.split(",")
      
      // Verwende latestPublishedTemplate, um dasselbe Template wie im DppEditor zu verwenden
      const template = await latestPublishedTemplate(contributorToken.dpp.category)

      if (!template) {
        console.error("[CONTRIBUTE_SUBMIT] Template nicht gefunden für Kategorie:", contributorToken.dpp.category)
        return NextResponse.json(
          { error: `Template nicht gefunden für Kategorie: ${contributorToken.dpp.category}` },
          { status: 404 }
        )
      }

      // Extrahiere fieldInstances aus submittedData (falls vorhanden)
      let allowedFieldIds: Set<string> | null = null
      if (contributorToken.submittedData && typeof contributorToken.submittedData === 'object' && 'assignedFieldInstances' in contributorToken.submittedData) {
        const data = contributorToken.submittedData as { assignedFieldInstances?: Array<{ fieldId: string; instanceId: string; label: string }> }
        if (data.assignedFieldInstances && data.assignedFieldInstances.length > 0) {
          allowedFieldIds = new Set(data.assignedFieldInstances.map(fi => fi.fieldId))
        }
      }

      // Filtere Blöcke: Nur die ausgewählten Blöcke
      const allowedBlocks = template.blocks.filter(block => blockIds.includes(block.id))

      // Lade oder erstelle DppContent
      let dppContent = await prisma.dppContent.findFirst({
        where: {
          dppId: contributorToken.dppId,
          isPublished: false
        }
      })

      const blocksData: any[] = allowedBlocks.map(block => {
        const blockData: any = {
          id: block.id,
          type: "template_block",
          order: block.order,
          data: {}
        }

        // Sammle Feldwerte für diesen Block
        // Wenn fieldInstances vorhanden sind, nur diese Felder; sonst alle Felder des Blocks
        block.fields.forEach(field => {
          // Prüfe, ob dieses Feld erlaubt ist
          if (allowedFieldIds !== null) {
            // Nur erlaubte Felder
            if (!allowedFieldIds.has(field.id)) {
              return // Überspringe dieses Feld
            }
          }
          
          const fieldKey = field.key
          if (data[fieldKey] !== undefined) {
            blockData.data[fieldKey] = data[fieldKey]
          }
        })

        return blockData
      })

      if (dppContent) {
        // Aktualisiere bestehenden DppContent
        const existingBlocks = (dppContent.blocks as any) || []
        const updatedBlocks = [...existingBlocks]
        
        // Merge Supplier-Daten in bestehende Blöcke oder füge neue hinzu
        blocksData.forEach(templateBlock => {
          const existingBlockIndex = updatedBlocks.findIndex((b: any) => b.id === templateBlock.id)
          if (existingBlockIndex >= 0) {
            // Merge: Behalte bestehende Daten, überschreibe nur Supplier-Felder
            updatedBlocks[existingBlockIndex] = {
              ...updatedBlocks[existingBlockIndex],
              data: {
                ...updatedBlocks[existingBlockIndex].data,
                ...templateBlock.data
              }
            }
          } else {
            // Neuer Block: Füge hinzu
            updatedBlocks.push(templateBlock)
          }
        })

        await prisma.dppContent.update({
          where: { id: dppContent.id },
          data: {
            blocks: updatedBlocks,
            updatedAt: new Date()
          }
        })
      } else {
        // Erstelle neuen DppContent (lade alle Blöcke vom Template)
        // Verwende dasselbe Template wie oben
        if (template) {
          // Erstelle vollständige Block-Struktur, aber nur Supplier-Blöcke mit Daten füllen
          const allBlocks = template.blocks.map(block => {
            const supplierBlock = blocksData.find(b => b.id === block.id)
            return {
              id: block.id,
              type: "template_block",
              order: block.order,
              data: supplierBlock ? supplierBlock.data : {} // Nur Supplier-Felder befüllt
            }
          })

          await prisma.dppContent.create({
            data: {
              dppId: contributorToken.dppId,
              blocks: allBlocks,
              isPublished: false
            }
          })
        }
      }
    } else if (contributorToken.sections) {
      // Legacy: sections-based approach
      const allowedSections = contributorToken.sections.split(",")
      const updateData: any = {}

      allowedSections.forEach((section) => {
        switch (section) {
          case DPP_SECTIONS.MATERIALS:
            if (data.materials !== undefined) {
              updateData.materials = data.materials || null
            }
            break
          case DPP_SECTIONS.MATERIAL_SOURCE:
            if (data.materialSource !== undefined) {
              updateData.materialSource = data.materialSource || null
            }
            break
          case DPP_SECTIONS.CARE:
            if (data.careInstructions !== undefined) {
              updateData.careInstructions = data.careInstructions || null
            }
            break
          case DPP_SECTIONS.REPAIR:
            if (data.isRepairable !== undefined) {
              updateData.isRepairable = data.isRepairable || null
            }
            if (data.sparePartsAvailable !== undefined) {
              updateData.sparePartsAvailable = data.sparePartsAvailable || null
            }
            break
          case DPP_SECTIONS.LIFESPAN:
            if (data.lifespan !== undefined) {
              updateData.lifespan = data.lifespan || null
            }
            break
          case DPP_SECTIONS.CONFORMITY:
            if (data.conformityDeclaration !== undefined) {
              updateData.conformityDeclaration = data.conformityDeclaration || null
            }
            break
          case DPP_SECTIONS.DISPOSAL:
            if (data.disposalInfo !== undefined) {
              updateData.disposalInfo = data.disposalInfo || null
            }
            break
          case DPP_SECTIONS.TAKEBACK:
            if (data.takebackOffered !== undefined) {
              updateData.takebackOffered = data.takebackOffered || null
            }
            if (data.takebackContact !== undefined) {
              updateData.takebackContact = data.takebackContact || null
            }
            break
          case DPP_SECTIONS.SECOND_LIFE:
            if (data.secondLifeInfo !== undefined) {
              updateData.secondLifeInfo = data.secondLifeInfo || null
            }
            break
        }
      })

      // Aktualisiere DPP mit den neuen Daten (Legacy)
      await prisma.dpp.update({
        where: { id: contributorToken.dppId },
        data: updateData,
      })
    }

    // Aktualisiere Contributor Token
    // WICHTIG: Behalte assignedFieldInstances aus dem ursprünglichen submittedData
    let finalSubmittedData: any = data
    if (contributorToken.submittedData && typeof contributorToken.submittedData === 'object' && 'assignedFieldInstances' in contributorToken.submittedData) {
      finalSubmittedData = {
        ...data,
        assignedFieldInstances: (contributorToken.submittedData as { assignedFieldInstances?: any }).assignedFieldInstances
      }
    }
    
    await prisma.contributorToken.update({
      where: { id: contributorToken.id },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        submittedData: finalSubmittedData,
      },
    })

    // Audit Log
    const ipAddress = getClientIp(request)
    await logDppAction(ACTION_TYPES.UPDATE, contributorToken.dppId, {
      actorId: undefined, // Externer Contributor, kein User
      actorRole: "SUPPLIER",
      organizationId: contributorToken.dpp.organizationId,
      source: SOURCES.API,
      complianceRelevant: true,
      ipAddress,
      metadata: {
        entityType: "CONTRIBUTOR_TOKEN",
        entityId: contributorToken.id,
        partnerRole: contributorToken.partnerRole,
        email: contributorToken.email,
        sections: contributorToken.sections,
      },
    })

    // Benachrichtige DPP Owner (alle ORG_ADMINs und ORG_OWNERs)
    const orgMemberships = contributorToken.dpp.organization.memberships
    for (const membership of orgMemberships) {
      await createNotification(
        membership.userId,
        "supplier_data_submitted",
        "contributor_token",
        contributorToken.id
      )
    }

    return NextResponse.json({
      success: true,
      message: "Daten erfolgreich übermittelt",
    })
  } catch (error) {
    console.error("Error submitting data:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

