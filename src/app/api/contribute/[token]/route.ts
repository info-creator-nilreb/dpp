export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DPP_SECTIONS } from "@/lib/permissions"

/**
 * GET /api/contribute/[token]
 * 
 * Validiert einen Contributor Token und gibt DPP-Kontext zurück
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token) {
      return NextResponse.json(
        { error: "Token ist erforderlich" },
        { status: 400 }
      )
    }

    // Hole Contributor Token mit Template
    const contributorToken = await prisma.contributorToken.findUnique({
      where: { token },
      include: {
        dpp: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
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
        {
          error: "Data already submitted",
          submitted: true,
          submittedAt: contributorToken.submittedAt,
        },
        { status: 400 }
      )
    }

    // Template-based: Lade Template und erlaubte Blöcke
    let template = null
    let allowedBlocks: any[] = []
    let allowedSections: string[] = [] // Legacy support

    if (contributorToken.blockIds) {
      // Template-based approach
      const blockIds = contributorToken.blockIds.split(",")
      
      template = await prisma.template.findFirst({
        where: {
          category: contributorToken.dpp.category,
          status: "active"
        },
        include: {
          blocks: {
            where: {
              id: { in: blockIds }
            },
            include: {
              fields: {
                orderBy: { order: "asc" }
              }
            },
            orderBy: { order: "asc" }
          }
        }
      })

      if (template) {
        allowedBlocks = template.blocks
      }
    } else if (contributorToken.sections) {
      // Legacy: sections-based approach
      allowedSections = contributorToken.sections.split(",")
      
      // Legacy DPP-Felder zurückgeben
      const dppData: any = {
        id: contributorToken.dpp.id,
        name: contributorToken.dpp.name,
        organizationName: contributorToken.dpp.organization.name,
      }

      allowedSections.forEach((section) => {
        switch (section) {
          case DPP_SECTIONS.MATERIALS:
            dppData.materials = contributorToken.dpp.materials
            break
          case DPP_SECTIONS.MATERIAL_SOURCE:
            dppData.materialSource = contributorToken.dpp.materialSource
            break
          case DPP_SECTIONS.CARE:
            dppData.careInstructions = contributorToken.dpp.careInstructions
            break
          case DPP_SECTIONS.REPAIR:
            dppData.isRepairable = contributorToken.dpp.isRepairable
            dppData.sparePartsAvailable = contributorToken.dpp.sparePartsAvailable
            break
          case DPP_SECTIONS.LIFESPAN:
            dppData.lifespan = contributorToken.dpp.lifespan
            break
          case DPP_SECTIONS.CONFORMITY:
            dppData.conformityDeclaration = contributorToken.dpp.conformityDeclaration
            break
          case DPP_SECTIONS.DISPOSAL:
            dppData.disposalInfo = contributorToken.dpp.disposalInfo
            break
          case DPP_SECTIONS.TAKEBACK:
            dppData.takebackOffered = contributorToken.dpp.takebackOffered
            dppData.takebackContact = contributorToken.dpp.takebackContact
            break
          case DPP_SECTIONS.SECOND_LIFE:
            dppData.secondLifeInfo = contributorToken.dpp.secondLifeInfo
            break
        }
      })

      return NextResponse.json({
        token: contributorToken.id,
        partnerRole: contributorToken.partnerRole,
        allowedSections,
        message: contributorToken.message,
        dpp: dppData,
        legacy: true, // Flag für Legacy-Modus
      })
    }

    // Template-based response
    return NextResponse.json({
      token: contributorToken.id,
      partnerRole: contributorToken.partnerRole,
      supplierMode: contributorToken.supplierMode || "input",
      message: contributorToken.message,
      dpp: {
        id: contributorToken.dpp.id,
        name: contributorToken.dpp.name,
        organizationName: contributorToken.dpp.organization.name,
      },
      template: template ? {
        id: template.id,
        name: template.name,
        blocks: allowedBlocks.map(block => ({
          id: block.id,
          name: block.name,
          fields: block.fields.map(field => ({
            id: field.id,
            label: field.label,
            key: field.key,
            type: field.type,
            required: field.required,
            config: field.config ? JSON.parse(field.config) : null
          }))
        }))
      } : null,
      legacy: false,
    })
  } catch (error) {
    console.error("Error validating token:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

