export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getPublicUrl } from "@/lib/getPublicUrl"
import { requireEditDPP } from "@/lib/api-permissions"
import { isInTrial } from "@/lib/pricing/features"
import { hasFeature, checkTestPhaseBlock } from "@/lib/capabilities/resolver"
import { getPublishedDppCount, canPublishDpp } from "@/lib/pricing/entitlements"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { getOrganizationRole } from "@/lib/permissions"
import { createNotificationWithPayload } from "@/lib/phase1/notifications"

/**
 * POST /api/app/dpp/[dppId]/publish
 *
 * Veröffentlicht den aktuellen Entwurf als neue Version (Draft bleibt weiter bearbeitbar).
 * - Erstellt neue Version (Snapshot: DPP-Daten, Medien, Content) mit fortlaufender Nummer
 * - Kopiert Draft-Medien in dpp_version_media, Draft-Content als isPublished: true mit versionId
 * - Setzt DPP-Status auf PUBLISHED (falls noch nicht gesetzt)
 * - Bearbeitungen an einem veröffentlichten DPP speichern weiter im Entwurf; erneutes Veröffentlichen = nächste Version
 */
export async function POST(
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

    // Prüfe Berechtigung zum Bearbeiten (Veröffentlichen erfordert Bearbeitungsrechte)
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    // Hole DPP mit allen Daten
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        media: true
      }
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Prüfe ob Name vorhanden (Pflichtfeld für Veröffentlichung)
    if (!dpp.name || dpp.name.trim() === "") {
      return NextResponse.json(
        { error: "Produktname ist erforderlich für die Veröffentlichung" },
        { status: 400 }
      )
    }

    // Prüfe Testphase-Block: Kein Veröffentlichen wenn bereits veröffentlichte DPPs existieren
    const testPhaseBlock = await checkTestPhaseBlock("publishVersion", {
      organizationId: dpp.organizationId,
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

    // Prüfe ob Organization im Trial ist und ob Publishing erlaubt ist (für neue Veröffentlichungen)
    const inTrial = await isInTrial(dpp.organizationId)
    const canPublishFeature = await hasFeature("publish_dpp", {
      organizationId: dpp.organizationId,
      userId: session.user.id,
    })
    
    if (inTrial && !canPublishFeature) {
      return NextResponse.json(
        { 
          error: "Veröffentlichung während der Testphase nicht verfügbar. Bitte upgraden Sie Ihr Abonnement, um DPPs zu veröffentlichen.",
          trialBlocked: true,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Prüfe Limit für veröffentlichte DPPs (nur wenn Status noch nicht PUBLISHED ist)
    if (dpp.status !== "PUBLISHED") {
      const limitCheck = await canPublishDpp(dpp.organizationId)
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { 
            error: limitCheck.reason || "Limit für veröffentlichte DPPs erreicht",
            limit: limitCheck.limit,
            current: limitCheck.current,
            remaining: limitCheck.remaining
          },
          { status: 403 }
        )
      }
    }

    // Finde höchste bestehende Versionsnummer
    const latestVersion = await prisma.dppVersion.findFirst({
      where: { dppId: dppId },
      orderBy: { version: "desc" },
      select: { version: true }
    })

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1

    // Speichere NUR den relativen Pfad in der DB (nicht die absolute URL)
    // Absolute URLs werden dynamisch zur Laufzeit mit getBaseUrl() generiert
    // Dies stellt sicher, dass URLs korrekt sind, auch nach Deployment-Umgebungswechsel
    const publicPath = `/public/dpp/${dppId}/v/${nextVersion}`
    
    console.log("Generated public path (relative):", publicPath)

    // QR-Codes werden on-demand via API Route generiert (kein Speichern nötig)
    // qrCodeImageUrl wird nicht mehr verwendet, bleibt null für Kompatibilität
    const qrCodeImageUrl: string | null = null

    // Stelle sicher, dass publicPath gesetzt ist (sollte immer der Fall sein)
    if (!publicPath || publicPath.trim() === "") {
      console.error("ERROR: publicPath is empty!")
      return NextResponse.json(
        { error: "Fehler bei der Generierung der öffentlichen URL" },
        { status: 500 }
      )
    }
    
    console.log("Values to save:", { publicPath, qrCodeImageUrl })

    // Transaktion: Erstelle Version und aktualisiere Status
    console.log("Starting publish transaction for DPP:", dppId)
    console.log("Next version number:", nextVersion)
    console.log("User ID:", session.user.id)
    
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle neue Version (Snapshot aller Daten)
      console.log("Creating DPP version with data:", {
        dppId: dppId,
        version: nextVersion,
        publicPath: publicPath,
        hasPublicPath: !!publicPath
      })
      
      const versionData = {
        dppId: dppId,
        version: nextVersion,
        name: dpp.name,
        description: dpp.description || null,
        category: dpp.category || "OTHER",
        sku: dpp.sku || null,
        gtin: dpp.gtin || null,
        brand: dpp.brand || null,
        countryOfOrigin: dpp.countryOfOrigin || null,
        materials: dpp.materials || null,
        materialSource: dpp.materialSource || null,
        careInstructions: dpp.careInstructions || null,
        isRepairable: dpp.isRepairable || null,
        sparePartsAvailable: dpp.sparePartsAvailable || null,
        lifespan: dpp.lifespan || null,
        conformityDeclaration: dpp.conformityDeclaration || null,
        disposalInfo: dpp.disposalInfo || null,
        takebackOffered: dpp.takebackOffered || null,
        takebackContact: dpp.takebackContact || null,
        secondLifeInfo: dpp.secondLifeInfo || null,
        createdByUserId: session.user.id,
        publicUrl: publicPath, // Relativer Pfad (z.B. /public/dpp/{id}/v/{version})
        qrCodeImageUrl: null // QR-Codes werden on-demand via API Route generiert (Vercel-compatible)
      }
      
      console.log("Version data to create:", JSON.stringify(versionData, null, 2))
      
      const version = await tx.dppVersion.create({
        data: versionData
      })

      console.log("DPP version created successfully:", version.id)
      console.log("Created version has publicPath:", version.publicUrl)

      // Kopiere alle Medien vom Draft in die Version (versionsgebundene Medien)
      if (dpp.media && dpp.media.length > 0) {
        const versionMedia = dpp.media.map((media: any) => ({
          versionId: version.id,
          fileName: media.fileName,
          fileType: media.fileType,
          fileSize: media.fileSize,
          storageUrl: media.storageUrl,
          role: media.role || null,
          blockId: media.blockId || null,
          fieldKey: media.fieldKey || null,
          uploadedAt: media.uploadedAt
        }))
        
        await tx.dppVersionMedia.createMany({
          data: versionMedia
        })
        console.log(`Copied ${versionMedia.length} media files to version ${nextVersion}`)
      }

      // Snapshot des aktuellen Entwurfs als veröffentlichten Content für diese Version
      // (Öffentliche Ansicht lädt dann diesen Snapshot, nicht den laufenden Entwurf)
      const draftContent = await tx.dppContent.findFirst({
        where: { dppId, isPublished: false },
        orderBy: { updatedAt: "desc" }
      })
      if (draftContent) {
        await tx.dppContent.create({
          data: {
            dppId,
            versionId: version.id,
            isPublished: true,
            blocks: draftContent.blocks,
            styling: draftContent.styling,
            createdBy: session.user.id
          }
        })
        console.log("Created published content snapshot for version", nextVersion)
      }

      // Setze Status auf PUBLISHED (falls noch nicht gesetzt)
      if (dpp.status !== "PUBLISHED") {
        await tx.dpp.update({
          where: { id: dppId },
          data: { status: "PUBLISHED" }
        })
        console.log("DPP status updated to PUBLISHED")
      }

      return version
    })
    
    console.log("Transaction completed successfully. Version ID:", result.id)
    console.log("Saved publicUrl:", result.publicUrl)
    console.log("Saved qrCodeImageUrl:", result.qrCodeImageUrl)

    // Audit Log: DPP veröffentlicht
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, dpp.organizationId)
    
    await logDppAction(ACTION_TYPES.PUBLISH, dppId, {
      actorId: session.user.id,
      actorRole: role || undefined,
      organizationId: dpp.organizationId,
      source: SOURCES.UI,
      complianceRelevant: true, // Veröffentlichung ist immer compliance-relevant
      versionId: result.id,
      ipAddress,
    })

    await createNotificationWithPayload(session.user.id, "dpp_published", {
      targetRoute: `/app/dpps/${dppId}`,
      targetEntityId: dppId,
      organisationId: dpp.organizationId,
    })

    // Hole Version mit User-Informationen (zur Verifizierung)
    const versionWithUser = await prisma.dppVersion.findUnique({
      where: { id: result.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log("Retrieved version from DB:")
    console.log("  - publicPath (stored):", versionWithUser?.publicUrl)
    console.log("  - qrCodeImageUrl:", versionWithUser?.qrCodeImageUrl)

    // Generiere absolute URL zur Laufzeit für Response (unterstützt auch bestehende absolute URLs)
    const absolutePublicUrl = getPublicUrl(versionWithUser!.publicUrl)

    return NextResponse.json(
      {
        message: "DPP erfolgreich veröffentlicht",
        version: {
          id: versionWithUser!.id,
          version: versionWithUser!.version,
          createdAt: versionWithUser!.createdAt,
          publicUrl: absolutePublicUrl, // Absolute URL für Client
          qrCodeImageUrl: versionWithUser!.qrCodeImageUrl,
          createdBy: {
            name: versionWithUser!.createdBy.name || versionWithUser!.createdBy.email,
            email: versionWithUser!.createdBy.email
          }
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error publishing DPP:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    
    // Prisma Unique Constraint Error (z.B. Versionsnummer existiert bereits)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Versionsnummer existiert bereits. Bitte versuchen Sie es erneut." },
        { status: 409 }
      )
    }

    // Detaillierte Fehlermeldung für Debugging
    return NextResponse.json(
      { 
        error: "Ein Fehler ist aufgetreten beim Veröffentlichen",
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
}

