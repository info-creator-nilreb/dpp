export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { generateVerificationToken } from "@/lib/email"
import { sendSupplierDataRequestEmail } from "@/lib/email"
import { getOrganizationRole } from "@/lib/permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { DPP_SECTIONS } from "@/lib/permissions"
import { latestPublishedTemplate } from "@/lib/template-helpers"

/**
 * POST /api/app/dpp/[dppId]/data-requests
 * 
 * Erstellt einen Data Request für einen Partner/Lieferanten
 */
export async function POST(
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

    // Prüfe Berechtigung zum Bearbeiten
    const permissionError = await requireEditDPP(params.dppId, session.user.id)
    if (permissionError) return permissionError

    const { email, partnerRole, mode, sections, blockIds, fieldInstances, message, sendEmail } = await request.json()
    const shouldSendEmail = sendEmail !== false // Default: true (für Backward Compatibility)

    // Validierung
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "E-Mail-Adresse ist erforderlich" },
        { status: 400 }
      )
    }

    if (!partnerRole) {
      return NextResponse.json(
        { error: "Partner-Rolle ist erforderlich" },
        { status: 400 }
      )
    }

    if (!mode || (mode !== "contribute" && mode !== "review")) {
      return NextResponse.json(
        { error: "Modus ist erforderlich (contribute oder review)" },
        { status: 400 }
      )
    }

    // Template-based: blockIds oder fieldInstances haben Vorrang, sections ist Legacy
    const hasBlockIds = blockIds && Array.isArray(blockIds) && blockIds.length > 0
    const hasFieldInstances = fieldInstances && Array.isArray(fieldInstances) && fieldInstances.length > 0
    const hasSections = sections && Array.isArray(sections) && sections.length > 0

    if (!hasBlockIds && !hasFieldInstances && !hasSections) {
      return NextResponse.json(
        { error: "Mindestens ein Block oder Feld muss ausgewählt werden" },
        { status: 400 }
      )
    }

    // Hole Template für supplierMode
    const dppWithTemplate = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!dppWithTemplate) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Prüfe DPP Supplier-Config (nicht Template-Config)
    // Mode aus Request: "contribute" -> "input", "review" -> "declaration"
    const supplierMode = mode === "review" ? "declaration" : "input"
    
    if (hasBlockIds) {
      // Lade DPP Supplier-Configs für die ausgewählten Blöcke
      const supplierConfigs = await prisma.dppBlockSupplierConfig.findMany({
        where: {
          dppId: params.dppId,
          blockId: { in: blockIds },
          enabled: true
        }
      })
      
      // Validierung: Alle ausgewählten Blöcke müssen enabled sein
      if (supplierConfigs.length !== blockIds.length) {
        return NextResponse.json(
          { error: "Nicht alle ausgewählten Blöcke sind für Lieferanten konfiguriert" },
          { status: 400 }
        )
      }
      
      // Validierung: Prüfe, ob alle Blöcke im Template existieren
      // Verwende latestPublishedTemplate, um dasselbe Template wie im DppEditor zu verwenden
      const template = await latestPublishedTemplate(dppWithTemplate.category)

      if (!template) {
        console.error("[DATA_REQUESTS_POST] Template nicht gefunden für Kategorie:", dppWithTemplate.category)
        return NextResponse.json(
          { error: `Template nicht gefunden für Kategorie: ${dppWithTemplate.category}` },
          { status: 404 }
        )
      }

      // Prüfe, ob alle ausgewählten Block-IDs im Template existieren
      const templateBlockIds = template.blocks.map(b => b.id)
      const missingBlockIds = blockIds.filter(id => !templateBlockIds.includes(id))
      
      if (missingBlockIds.length > 0) {
        console.error("[DATA_REQUESTS_POST] Fehlende Block-IDs:", missingBlockIds, "Template Block-IDs:", templateBlockIds, "Angeforderte Block-IDs:", blockIds)
        return NextResponse.json(
          { error: `Folgende Blöcke existieren nicht im Template: ${missingBlockIds.join(", ")}` },
          { status: 400 }
        )
      }
      
      // Validierung: Kein AUSGEWÄHLTER Block darf order === 0 sein (Produktidentität)
      // Prüfe nur die ausgewählten Blöcke, nicht alle Blöcke im Template
      const selectedBlocks = template.blocks.filter(b => blockIds.includes(b.id))
      const hasIdentityBlock = selectedBlocks.some(b => b.order === 0)
      if (hasIdentityBlock) {
        const identityBlockNames = selectedBlocks.filter(b => b.order === 0).map(b => b.name).join(", ")
        return NextResponse.json(
          { error: `Basisdaten-Block kann keine Lieferanten-Konfiguration haben. Ausgewählter Block: ${identityBlockNames}` },
          { status: 400 }
        )
      }
    }

    // Validierung für fieldInstances (falls vorhanden)
    if (hasFieldInstances) {
      // Verwende latestPublishedTemplate, um dasselbe Template wie im DppEditor zu verwenden
      const template = await latestPublishedTemplate(dppWithTemplate.category)

      if (!template) {
        console.error("[DATA_REQUESTS_POST] Template nicht gefunden für Kategorie:", dppWithTemplate.category)
        return NextResponse.json(
          { error: `Template nicht gefunden für Kategorie: ${dppWithTemplate.category}` },
          { status: 404 }
        )
      }

      // Sammle alle Feld-IDs aus dem Template
      const templateFieldIds = new Set<string>()
      template.blocks.forEach(block => {
        block.fields.forEach(field => {
          templateFieldIds.add(field.id)
        })
      })

      // Prüfe, ob alle fieldInstances im Template existieren
      const invalidFieldInstances = fieldInstances.filter(fi => !templateFieldIds.has(fi.fieldId))
      
      if (invalidFieldInstances.length > 0) {
        console.error("[DATA_REQUESTS_POST] Ungültige Feld-IDs:", invalidFieldInstances.map(fi => fi.fieldId), "Template Feld-IDs:", Array.from(templateFieldIds))
        return NextResponse.json(
          { error: `Folgende Felder existieren nicht im Template: ${invalidFieldInstances.map(fi => fi.label || fi.fieldId).join(", ")}` },
          { status: 400 }
        )
      }

      // Prüfe, ob die Felder zu supplier-fähigen Blöcken gehören
      const fieldBlockMap = new Map<string, string>() // fieldId -> blockId
      template.blocks.forEach(block => {
        block.fields.forEach(field => {
          fieldBlockMap.set(field.id, block.id)
        })
      })

      // Lade DPP Supplier-Configs für die Blöcke der ausgewählten Felder
      const fieldBlockIds = Array.from(new Set(fieldInstances.map(fi => fieldBlockMap.get(fi.fieldId)).filter(Boolean) as string[]))
      if (fieldBlockIds.length > 0) {
        // Validierung: Kein ausgewähltes Feld darf zu einem Block mit order === 0 gehören (Basisdatenblock)
        const selectedBlocks = template.blocks.filter(b => fieldBlockIds.includes(b.id))
        const hasIdentityBlock = selectedBlocks.some(b => b.order === 0)
        if (hasIdentityBlock) {
          const identityBlockNames = selectedBlocks.filter(b => b.order === 0).map(b => b.name).join(", ")
          return NextResponse.json(
            { error: `Basisdaten-Block kann keine Lieferanten-Konfiguration haben. Ausgewählte Felder gehören zu: ${identityBlockNames}` },
            { status: 400 }
          )
        }

        const supplierConfigs = await prisma.dppBlockSupplierConfig.findMany({
          where: {
            dppId: params.dppId,
            blockId: { in: fieldBlockIds },
            enabled: true
          }
        })

        const enabledBlockIds = new Set(supplierConfigs.map(sc => sc.blockId))
        const disabledBlocks = fieldBlockIds.filter(blockId => !enabledBlockIds.has(blockId))
        
        if (disabledBlocks.length > 0) {
          return NextResponse.json(
            { error: "Nicht alle Blöcke der ausgewählten Felder sind für Lieferanten konfiguriert" },
            { status: 400 }
          )
        }
      }
    }

    // Generiere Token
    const token = generateVerificationToken()

    // Token ist 14 Tage gültig
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    // Erstelle Contributor Token (Template-based mit blockIds und fieldInstances)
    // fieldInstances werden als JSON in submittedData gespeichert (wird später bei Submission überschrieben)
    // Für die Zuordnung nutzen wir eine Kombination aus blockIds und einem separaten JSON-Feld
    const contributorToken = await prisma.contributorToken.create({
      data: {
        token,
        dppId: params.dppId,
        email: email.toLowerCase().trim(),
        partnerRole,
        sections: hasSections ? sections.join(",") : null, // Legacy support
        blockIds: hasBlockIds ? blockIds.join(",") : null, // Template-based
        supplierMode: supplierMode, // "input" (contribute) oder "declaration" (review)
        message: message?.trim() || null,
        status: "pending",
        expiresAt,
        requestedBy: session.user.id,
        // fieldInstances als JSON speichern (temporär, wird bei Submission überschrieben)
        ...(hasFieldInstances && {
          submittedData: { assignedFieldInstances: fieldInstances }
        }),
      },
    })

    // Generiere Magic Link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    const contributeUrl = `${baseUrl}/contribute/${token}`

    // Sende E-Mail (nur wenn shouldSendEmail === true)
    let emailSent = false
    let emailError: Error | null = null
    let emailSentAt: Date | null = null
    if (shouldSendEmail) {
      try {
        await sendSupplierDataRequestEmail(email, {
          organizationName: dppWithTemplate.organization.name,
          productName: dppWithTemplate.name,
          partnerRole,
          contributeUrl,
        })
        emailSent = true
        emailSentAt = new Date()
        
        // Aktualisiere ContributorToken mit emailSentAt
        await prisma.contributorToken.update({
          where: { id: contributorToken.id },
          data: { emailSentAt }
        })
      } catch (err) {
        emailError = err instanceof Error ? err : new Error(String(err))
        console.error("[DATA_REQUESTS_POST] E-Mail-Versand fehlgeschlagen:", emailError)
        // Token wurde bereits erstellt, aber wir geben den Fehler an das Frontend weiter
      }
    }

    // Audit Log
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, dppWithTemplate.organizationId)

    await logDppAction(ACTION_TYPES.CREATE, params.dppId, {
      actorId: session.user.id,
      actorRole: role || undefined,
      organizationId: dppWithTemplate.organizationId,
      source: SOURCES.UI,
      complianceRelevant: false,
      ipAddress,
      metadata: {
        entityType: "CONTRIBUTOR_TOKEN",
        entityId: contributorToken.id,
        partnerRole,
        sections: hasSections ? sections.join(",") : null,
        blockIds: hasBlockIds ? blockIds.join(",") : null,
      },
    })

    return NextResponse.json({
      success: true,
      tokenId: contributorToken.id,
      contributeUrl, // Für Development/Testing
      emailSent, // Informiere Frontend, ob E-Mail versendet wurde
      ...(emailError && { emailError: emailError.message }) // Fehlermeldung, falls E-Mail fehlgeschlagen ist
    })
  } catch (error) {
    console.error("Error creating data request:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/app/dpp/[dppId]/data-requests
 * 
 * Holt alle Data Requests für einen DPP
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

    // Prüfe Berechtigung zum Ansehen
    const permissionError = await requireEditDPP(params.dppId, session.user.id)
    if (permissionError) return permissionError

    // Hole alle Contributor Tokens für diesen DPP
    const tokens = await prisma.contributorToken.findMany({
      where: { dppId: params.dppId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        partnerRole: true,
        sections: true,
        blockIds: true,
        supplierMode: true,
        status: true,
        expiresAt: true,
        submittedAt: true,
        emailSentAt: true,
        submittedData: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      requests: tokens.map((token) => {
        // Extrahiere fieldInstances aus submittedData (falls vorhanden und noch nicht eingereicht)
        let fieldInstances: Array<{ fieldId: string; instanceId: string; label: string }> | undefined = undefined
        if (token.submittedData && typeof token.submittedData === 'object' && 'assignedFieldInstances' in token.submittedData) {
          const data = token.submittedData as { assignedFieldInstances?: Array<{ fieldId: string; instanceId: string; label: string }> }
          fieldInstances = data.assignedFieldInstances
        }

        return {
          id: token.id,
          email: token.email,
          partnerRole: token.partnerRole,
          sections: token.sections ? token.sections.split(",") : undefined, // Legacy
          blockIds: token.blockIds ? token.blockIds.split(",") : undefined, // Template-based
          fieldInstances: fieldInstances, // Field-level assignments
          supplierMode: token.supplierMode || undefined,
          status: token.status,
          expiresAt: token.expiresAt,
          submittedAt: token.submittedAt,
          emailSentAt: token.emailSentAt,
          createdAt: token.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error("Error fetching data requests:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/app/dpp/[dppId]/data-requests
 * 
 * Löscht einen Data Request (Beteiligten-Einladung)
 * - Prüft Berechtigung
 * - Löscht Contributor Token
 */
export async function DELETE(
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

    const { dppId } = params
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("requestId")

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID ist erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe Berechtigung zum Bearbeiten
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    // Prüfe, ob der Request zu diesem DPP gehört
    const token = await prisma.contributorToken.findUnique({
      where: { id: requestId },
      select: { dppId: true }
    })

    if (!token) {
      return NextResponse.json(
        { error: "Data Request nicht gefunden" },
        { status: 404 }
      )
    }

    if (token.dppId !== dppId) {
      return NextResponse.json(
        { error: "Data Request gehört nicht zu diesem DPP" },
        { status: 403 }
      )
    }

    // Lösche Contributor Token
    await prisma.contributorToken.delete({
      where: { id: requestId }
    })

    return NextResponse.json({
      success: true,
      message: "Beteiligter erfolgreich entfernt"
    })
  } catch (error: any) {
    console.error("Error deleting data request:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Entfernen des Beteiligten" },
      { status: 500 }
    )
  }
}


