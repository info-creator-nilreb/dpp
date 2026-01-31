/**
 * DPP Content Styling API
 * 
 * PUT: Update styling configuration (Premium only)
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"
import { validateStyling } from "@/lib/cms/validation"
import { StylingConfig, UpdateStylingRequest } from "@/lib/cms/types"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { getOrganizationRole } from "@/lib/permissions"

/**
 * PUT /api/app/dpp/[dppId]/content/styling
 * 
 * Updates styling configuration
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    let session
    try {
      session = await auth()
    } catch (authError) {
      console.error("Auth error in styling route:", authError)
      return NextResponse.json(
        { error: "Authentifizierungsfehler" },
        { status: 401 }
      )
    }
    
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Check permissions
    const permissionError = await requireEditDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) {
      return permissionError
    }

    // Load DPP
    const dpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      select: { organizationId: true }
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    const context: CapabilityContext = {
      organizationId: dpp.organizationId,
      userId: session.user.id
    }

    // Check styling feature (Premium only)
    const hasStylingFeature = await hasFeature("cms_styling", context)
    if (!hasStylingFeature) {
      return NextResponse.json(
        { error: "Styling ist nicht verfügbar. Upgrade auf Premium Plan erforderlich." },
        { status: 403 }
      )
    }

    let body: UpdateStylingRequest
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: "Ungültige JSON-Daten" },
        { status: 400 }
      )
    }
    const { logo, colors, fonts, spacing } = body

    // Load existing content
    const existingContent = await prisma.dppContent.findFirst({
      where: {
        dppId: resolvedParams.dppId,
        isPublished: false
      }
    })

    // Get existing styling or create default (use system defaults)
    const existingStyling = existingContent?.styling as StylingConfig | null
    const currentStyling: StylingConfig = existingStyling || {
      colors: {
        primary: "#0A0A0A", // System default
        secondary: "#7A7A7A", // System default
        accent: "#24c598" // System default
      }
    }

    // Merge updates (logo === null = explizit entfernen)
    const updatedStyling: StylingConfig = {
      ...currentStyling,
      logo: logo === null ? undefined : (logo !== undefined ? logo : currentStyling.logo),
      colors: {
        ...currentStyling.colors,
        ...(colors || {})
      },
      fonts: {
        ...currentStyling.fonts,
        ...(fonts || {})
      },
      spacing: {
        ...currentStyling.spacing,
        ...(spacing || {})
      }
    }

    // Validate styling
    const validation = await validateStyling(updatedStyling, context)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validierungsfehler",
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Update or create content
    if (existingContent) {
      await prisma.dppContent.update({
        where: { id: existingContent.id },
        data: {
          styling: updatedStyling,
          updatedAt: new Date()
        }
      })
    } else {
      await prisma.dppContent.create({
        data: {
          dppId: resolvedParams.dppId,
          blocks: [],
          styling: updatedStyling,
          isPublished: false,
          createdBy: session.user.id
        }
      })
    }

    // Audit log
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, dpp.organizationId)
    
    await logDppAction(ACTION_TYPES.UPDATE, resolvedParams.dppId, {
      actorId: session.user.id,
      actorRole: role || undefined,
      organizationId: dpp.organizationId,
      source: SOURCES.UI,
      complianceRelevant: false,
      ipAddress,
      metadata: {
        contentType: "cms_styling"
      }
    })

    return NextResponse.json({
      message: "Styling aktualisiert",
      styling: updatedStyling
    })
  } catch (error: any) {
    console.error("Error updating styling:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

