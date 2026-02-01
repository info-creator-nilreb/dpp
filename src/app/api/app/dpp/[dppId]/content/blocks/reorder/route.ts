/**
 * DPP Content Blocks Reorder API
 * 
 * POST: Reorder blocks
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"
import { Block, ReorderBlocksRequest } from "@/lib/cms/types"

/**
 * POST /api/app/dpp/[dppId]/content/blocks/reorder
 * 
 * Reorders blocks
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

    // Check permissions
    const permissionError = await requireEditDPP(dppId, session.user.id)
    if (permissionError) {
      return permissionError
    }

    // Load DPP
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
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

    const body: ReorderBlocksRequest = await request.json()
    const { blockIds } = body

    if (!Array.isArray(blockIds) || blockIds.length === 0) {
      return NextResponse.json(
        { error: "blockIds muss ein nicht-leeres Array sein" },
        { status: 400 }
      )
    }

    // Load existing content
    const existingContent = await prisma.dppContent.findFirst({
      where: {
        dppId,
        isPublished: false
      }
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: "Content nicht gefunden" },
        { status: 404 }
      )
    }

    const blocks = ((existingContent.blocks as unknown) as Block[]) || []

    // Validate all block IDs exist
    const blockIdSet = new Set(blockIds)
    const existingBlockIds = new Set(blocks.map(b => b.id))
    
    for (const blockId of blockIds) {
      if (!existingBlockIds.has(blockId)) {
        return NextResponse.json(
          { error: `Block nicht gefunden: ${blockId}` },
          { status: 400 }
        )
      }
    }

    // Check if all blocks are included
    if (blockIdSet.size !== blocks.length) {
      return NextResponse.json(
        { error: "Alle Blöcke müssen in der neuen Reihenfolge enthalten sein" },
        { status: 400 }
      )
    }

    // Create block map for quick lookup
    const blockMap = new Map(blocks.map(b => [b.id, b]))

    // Reorder blocks
    const reorderedBlocks: Block[] = blockIds.map((blockId, index) => {
      const block = blockMap.get(blockId)!
      return {
        ...block,
        order: index
      }
    })

    // Save updated content
    await prisma.dppContent.update({
      where: { id: existingContent.id },
      data: {
        blocks: reorderedBlocks as unknown as Prisma.InputJsonValue,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Blöcke neu geordnet",
      blocks: reorderedBlocks
    })
  } catch (error: any) {
    console.error("Error reordering blocks:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

