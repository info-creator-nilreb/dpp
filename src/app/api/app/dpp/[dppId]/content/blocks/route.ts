/**
 * DPP Content Blocks API
 * 
 * POST: Create a new block
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"
import { validateBlock } from "@/lib/cms/validation"
import { Block, CreateBlockRequest, BlockTypeKey } from "@/lib/cms/types"
import { BLOCK_TYPE_FEATURE_MAP } from "@/lib/cms/validation"

/**
 * POST /api/app/dpp/[dppId]/content/blocks
 * 
 * Creates a new block
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const resolvedParams = await params

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

    // Check CMS access
    const hasCmsAccess = await hasFeature("cms_access", context)
    if (!hasCmsAccess) {
      return NextResponse.json(
        { error: "CMS-Zugriff nicht verfügbar" },
        { status: 403 }
      )
    }

    const body: CreateBlockRequest = await request.json()
    const { type, content, order } = body

    // Validate block type
    const featureKey = BLOCK_TYPE_FEATURE_MAP[type as BlockTypeKey]
    if (!featureKey) {
      return NextResponse.json(
        { error: `Unbekannter Block-Typ: ${type}` },
        { status: 400 }
      )
    }

    // Check feature availability
    const hasBlockFeature = await hasFeature(featureKey, context)
    if (!hasBlockFeature) {
      return NextResponse.json(
        { error: `Block-Typ "${type}" ist nicht verfügbar. Upgrade erforderlich.` },
        { status: 403 }
      )
    }

    // Load existing content
    const existingContent = await prisma.dppContent.findFirst({
      where: {
        dppId: resolvedParams.dppId,
        isPublished: false
      }
    })

    const existingBlocks = (existingContent?.blocks as Block[]) || []
    
    // Determine order (append if not provided)
    const blockOrder = order !== undefined 
      ? order 
      : existingBlocks.length > 0 
        ? Math.max(...existingBlocks.map(b => b.order)) + 1 
        : 0

    // Create new block
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as BlockTypeKey,
      featureKey,
      order: blockOrder,
      status: "draft",
      content: content || {}
    }

    // Validate block
    const validation = await validateBlock(newBlock, context)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validierungsfehler",
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Update content with new block
    const updatedBlocks = [...existingBlocks, newBlock]

    if (existingContent) {
      // Update existing content
      await prisma.dppContent.update({
        where: { id: existingContent.id },
        data: {
          blocks: updatedBlocks,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new content
      await prisma.dppContent.create({
        data: {
          dppId: resolvedParams.dppId,
          blocks: updatedBlocks,
          isPublished: false,
          createdBy: session.user.id
        }
      })
    }

    return NextResponse.json({
      message: "Block erstellt",
      block: newBlock
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating block:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

