export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DPP_SECTIONS } from "@/lib/permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { createNotification } from "@/lib/phase1/notifications"

/**
 * POST /api/contribute/[token]/submit
 * 
 * Reicht Daten für einen Contributor Token ein
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
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

    // Parse Sections
    const allowedSections = contributorToken.sections.split(",")

    // Validiere und filtere Daten basierend auf erlaubten Sektionen
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

    // Prüfe Bestätigung
    if (!data.confirmed) {
      return NextResponse.json(
        { error: "Bitte bestätigen Sie die Richtigkeit der Daten" },
        { status: 400 }
      )
    }

    // Aktualisiere DPP mit den neuen Daten
    await prisma.dpp.update({
      where: { id: contributorToken.dppId },
      data: updateData,
    })

    // Aktualisiere Contributor Token
    await prisma.contributorToken.update({
      where: { id: contributorToken.id },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        submittedData: data,
      },
    })

    // Audit Log
    const ipAddress = getClientIp(request)
    await logDppAction(ACTION_TYPES.UPDATE, contributorToken.dppId, {
      actorId: null, // Externer Contributor, kein User
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

