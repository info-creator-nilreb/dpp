export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateQrCode } from "@/lib/qrcode"

/**
 * POST /api/app/dpp/[dppId]/publish
 * 
 * Veröffentlicht den aktuellen Draft als neue Version
 * - Kopiert alle Daten vom Draft
 * - Erstellt neue Version mit fortlaufender Nummer
 * - Setzt DPP-Status auf PUBLISHED (wenn noch nicht gesetzt)
 * - Speichert Bearbeiter für Audit-Trail
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

    // Prüfe Zugriff auf DPP
    const accessCheck = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!accessCheck || accessCheck.organization.memberships.length === 0) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diesen DPP" },
        { status: 403 }
      )
    }

    // Hole DPP mit allen Daten
    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
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

    // Finde höchste bestehende Versionsnummer
    const latestVersion = await prisma.dppVersion.findFirst({
      where: { dppId: params.dppId },
      orderBy: { version: "desc" },
      select: { version: true }
    })

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1

    // Generiere Public URL für diese Version (IMMER erforderlich)
    // Verwende Request-URL für Base-URL (funktioniert in allen Umgebungen)
    const requestUrl = new URL(request.url)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      process.env.AUTH_URL ||
      `${requestUrl.protocol}//${requestUrl.host}`
    const publicUrl = `${baseUrl}/public/dpp/${params.dppId}/v/${nextVersion}`
    
    console.log("Generated public URL:", publicUrl, "baseUrl:", baseUrl)

    // Generiere QR-Code (kann fehlschlagen, dann bleibt qrCodeImageUrl null)
    let qrCodeImageUrl: string | null = null
    try {
      console.log("Generating QR code for:", publicUrl)
      qrCodeImageUrl = await generateQrCode(publicUrl, params.dppId, nextVersion)
      console.log("QR code generated successfully:", qrCodeImageUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
      // QR-Code-Generierung ist nicht kritisch, Version wird trotzdem erstellt
      // qrCodeImageUrl bleibt null
    }

    // Stelle sicher, dass publicUrl gesetzt ist (sollte immer der Fall sein)
    if (!publicUrl || publicUrl.trim() === "") {
      console.error("ERROR: publicUrl is empty!")
      return NextResponse.json(
        { error: "Fehler bei der Generierung der öffentlichen URL" },
        { status: 500 }
      )
    }
    
    console.log("Values to save:", { publicUrl, qrCodeImageUrl })

    // Transaktion: Erstelle Version und aktualisiere Status
    console.log("Starting publish transaction for DPP:", params.dppId)
    console.log("Next version number:", nextVersion)
    console.log("User ID:", session.user.id)
    
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle neue Version (Snapshot aller Daten)
      console.log("Creating DPP version with data:", {
        dppId: params.dppId,
        version: nextVersion,
        publicUrl: publicUrl,
        qrCodeImageUrl: qrCodeImageUrl,
        hasPublicUrl: !!publicUrl,
        hasQrCodeUrl: !!qrCodeImageUrl
      })
      
      const versionData = {
        dppId: params.dppId,
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
        publicUrl: publicUrl, // IMMER setzen
        qrCodeImageUrl: qrCodeImageUrl // Kann null sein, wenn QR-Code-Generierung fehlgeschlagen ist
      }
      
      console.log("Version data to create:", JSON.stringify(versionData, null, 2))
      
      const version = await tx.dppVersion.create({
        data: versionData
      })

      console.log("DPP version created successfully:", version.id)
      console.log("Created version has publicUrl:", version.publicUrl)
      console.log("Created version has qrCodeImageUrl:", version.qrCodeImageUrl)

      // Setze Status auf PUBLISHED (falls noch nicht gesetzt)
      if (dpp.status !== "PUBLISHED") {
        await tx.dpp.update({
          where: { id: params.dppId },
          data: { status: "PUBLISHED" }
        })
        console.log("DPP status updated to PUBLISHED")
      }

      return version
    })
    
    console.log("Transaction completed successfully. Version ID:", result.id)
    console.log("Saved publicUrl:", result.publicUrl)
    console.log("Saved qrCodeImageUrl:", result.qrCodeImageUrl)

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
    console.log("  - publicUrl:", versionWithUser?.publicUrl)
    console.log("  - qrCodeImageUrl:", versionWithUser?.qrCodeImageUrl)

    return NextResponse.json(
      {
        message: "DPP erfolgreich veröffentlicht",
        version: {
          id: versionWithUser!.id,
          version: versionWithUser!.version,
          createdAt: versionWithUser!.createdAt,
          publicUrl: versionWithUser!.publicUrl,
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

