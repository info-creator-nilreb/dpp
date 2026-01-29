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

    // Normalize block statuses (ensure all blocks have valid status)
    const blocks = (activeContent.blocks as Block[]) || []
    const normalizedBlocks = blocks.map(block => ({
      ...block,
      // Ensure status is always "draft" or "published" (default to "draft" if missing or invalid)
      status: (block.status === "draft" || block.status === "published") 
        ? block.status 
        : "draft"
    }))

    return NextResponse.json({
      content: {
        blocks: normalizedBlocks,
        styling: resolvedStyling,
        fieldValues: (activeContent as any).fieldValues ?? {},
        fieldInstances: (activeContent as any).fieldInstances ?? {}
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
      console.error("[Content API] Validierungsfehler:", validation.errors)
      console.error("[Content API] Blocks:", JSON.stringify(blocks || [], null, 2))
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
        content: updated,
        updatedAt: updated.updatedAt
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
        content: created,
        updatedAt: created.updatedAt || created.createdAt
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

/**
 * PUT /api/app/dpp/[dppId]/content
 *
 * Aktualisiert nur Pflichtdaten (fieldValues, fieldInstances).
 * Body: { fieldValues?: Record<string, string | string[]>, fieldInstances?: Record<string, any[]> }
 */
export async function PUT(
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

    const permissionError = await requireEditDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const body = await request.json()
    const fieldValues = body.fieldValues
    const fieldInstances = body.fieldInstances

    const dpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      select: { organizationId: true }
    })
    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

    const existingDraft = await prisma.dppContent.findFirst({
      where: {
        dppId: resolvedParams.dppId,
        isPublished: false
      }
    })

    const payload: { fieldValues?: object; fieldInstances?: object } = {}
    if (fieldValues !== undefined && typeof fieldValues === "object") {
      payload.fieldValues = fieldValues
    }
    if (fieldInstances !== undefined && typeof fieldInstances === "object") {
      payload.fieldInstances = fieldInstances
    }

    if (existingDraft) {
      const updated = await prisma.dppContent.update({
        where: { id: existingDraft.id },
        data: payload
      })
      return NextResponse.json({
        message: "Feldwerte gespeichert",
        content: updated,
        updatedAt: updated.updatedAt
      })
    }

    const created = await prisma.dppContent.create({
      data: {
        dppId: resolvedParams.dppId,
        blocks: [],
        styling: null,
        ...payload,
        isPublished: false,
        createdBy: session.user.id
      }
    })
    return NextResponse.json({
      message: "Feldwerte gespeichert",
      content: created,
      updatedAt: created.updatedAt
    })
  } catch (error: any) {
    console.error("Error updating DPP content (PUT):", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

