/**
 * DPP Content API
 * 
 * GET: Load DPP content (blocks + styling)
 * POST: Create or update DPP content
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP, requireEditDPP } from "@/lib/api-permissions"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"
import { validateDppContent, resolveTheme } from "@/lib/cms/validation"
import { Block, StylingConfig } from "@/lib/cms/types"
import { defaultStylingConfig } from "@/lib/cms/schemas"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { getOrganizationRole } from "@/lib/permissions"

/**
 * GET /api/app/dpp/[dppId]/content
 * 
 * Loads DPP content (blocks + styling)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Check permissions
    const permissionError = await requireViewDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) {
      return permissionError
    }

    // Load DPP to get organization
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

    // Load content (draft or published)
    const content = await prisma.dppContent.findFirst({
      where: {
        dppId: resolvedParams.dppId,
        isPublished: false // Load draft by default
      },
      orderBy: { updatedAt: "desc" }
    })

    // If no draft, try to load published
    const publishedContent = content
      ? null
      : await prisma.dppContent.findFirst({
          where: {
            dppId: resolvedParams.dppId,
            isPublished: true
          },
          orderBy: { updatedAt: "desc" }
        })

    const activeContent = content || publishedContent

    if (!activeContent) {
      // Return empty content structure
      return NextResponse.json({
        content: {
          blocks: [],
          styling: defaultStylingConfig
        }
      })
    }

    // Resolve theme with defaults
    const styling = activeContent.styling as StylingConfig | null
    const resolvedStyling = resolveTheme(styling || undefined)

    return NextResponse.json({
      content: {
        blocks: activeContent.blocks as Block[],
        styling: resolvedStyling
      },
      isPublished: activeContent.isPublished
    })
  } catch (error: any) {
    console.error("Error loading DPP content:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/app/dpp/[dppId]/content
 * 
 * Creates or updates DPP content
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
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

    // Check CMS access
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

    const hasCmsAccess = await hasFeature("cms_access", context)
    if (!hasCmsAccess) {
      return NextResponse.json(
        { error: "CMS-Zugriff nicht verfügbar" },
        { status: 403 }
      )
    }

    const { blocks, styling, publish } = await request.json()

    // Validate content
    const validation = await validateDppContent(
      blocks || [],
      styling,
      context
    )

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validierungsfehler",
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Check publishing capability if trying to publish
    if (publish) {
      const canPublish = await hasFeature("publish_dpp", context)
      if (!canPublish) {
        return NextResponse.json(
          { error: "Veröffentlichung nicht verfügbar. Upgrade erforderlich." },
          { status: 403 }
        )
      }
    }

    // Check if draft content exists
    const existingDraft = await prisma.dppContent.findFirst({
      where: {
        dppId: resolvedParams.dppId,
        isPublished: false
      }
    })

    // Create or update content
    const contentData = {
      blocks: blocks || [],
      styling: styling || null
    }

    if (existingDraft) {
      // Update existing draft
      const updated = await prisma.dppContent.update({
        where: { id: existingDraft.id },
        data: {
          blocks: contentData.blocks,
          styling: contentData.styling,
          isPublished: publish ? true : false,
          updatedAt: new Date()
        }
      })

      // Audit log
      const ipAddress = getClientIp(request)
      const role = await getOrganizationRole(session.user.id, dpp.organizationId)
      
      await logDppAction(
        publish ? ACTION_TYPES.PUBLISH : ACTION_TYPES.UPDATE,
        resolvedParams.dppId,
        {
          actorId: session.user.id,
          actorRole: role || undefined,
          organizationId: dpp.organizationId,
          source: SOURCES.UI,
          complianceRelevant: publish,
          ipAddress,
          metadata: {
            contentType: "cms",
            blockCount: blocks?.length || 0
          }
        }
      )

      return NextResponse.json({
        message: publish ? "Content veröffentlicht" : "Content gespeichert",
        content: updated
      })
    } else {
      // Create new content
      const created = await prisma.dppContent.create({
        data: {
          dppId: resolvedParams.dppId,
          blocks: contentData.blocks,
          styling: contentData.styling,
          isPublished: publish ? true : false,
          createdBy: session.user.id
        }
      })

      // Audit log
      const ipAddress = getClientIp(request)
      const role = await getOrganizationRole(session.user.id, dpp.organizationId)
      
      await logDppAction(
        publish ? ACTION_TYPES.PUBLISH : ACTION_TYPES.CREATE,
        resolvedParams.dppId,
        {
          actorId: session.user.id,
          actorRole: role || undefined,
          organizationId: dpp.organizationId,
          source: SOURCES.UI,
          complianceRelevant: publish,
          ipAddress,
          metadata: {
            contentType: "cms",
            blockCount: blocks?.length || 0
          }
        }
      )

      return NextResponse.json({
        message: publish ? "Content veröffentlicht" : "Content erstellt",
        content: created
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error("Error saving DPP content:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

