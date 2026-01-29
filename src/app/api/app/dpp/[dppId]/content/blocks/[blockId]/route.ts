/**
 * DPP Content Block API
 * 
 * PUT: Update a block
 * DELETE: Delete a block
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"
import { validateBlock } from "@/lib/cms/validation"
import { Block, UpdateBlockRequest } from "@/lib/cms/types"

/**
 * PUT /api/app/dpp/[dppId]/content/blocks/[blockId]
 * 
 * Updates a block
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ dppId: string; blockId: string }> }
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

    // Load existing content
    const existingContent = await prisma.dppContent.findFirst({
      where: {
        dppId: resolvedParams.dppId,
        isPublished: false
      }
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: "Content nicht gefunden" },
        { status: 404 }
      )
    }

    const blocks = (existingContent.blocks as Block[]) || []
    const blockIndex = blocks.findIndex(b => b.id === resolvedParams.blockId)

    if (blockIndex === -1) {
      return NextResponse.json(
        { error: "Block nicht gefunden" },
        { status: 404 }
      )
    }

    const body: UpdateBlockRequest = await request.json()
    const { content, order, status } = body

    // Update block
    // Normalize status: ensure it's always "draft" or "published"
    const currentStatus = blocks[blockIndex].status
    const newStatus = status !== undefined ? status : currentStatus
    const normalizedStatus = (newStatus === "draft" || newStatus === "published") 
      ? newStatus 
      : (currentStatus === "draft" || currentStatus === "published" 
          ? currentStatus 
          : "draft")
    
    const updatedBlock: Block = {
      ...blocks[blockIndex],
      content: content !== undefined ? content : blocks[blockIndex].content,
      order: order !== undefined ? order : blocks[blockIndex].order,
      status: normalizedStatus
    }

    // Validate updated block
    const validation = await validateBlock(updatedBlock, context)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validierungsfehler",
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Update blocks array
    const updatedBlocks = [...blocks]
    updatedBlocks[blockIndex] = updatedBlock

    // Save updated content
    await prisma.dppContent.update({
      where: { id: existingContent.id },
      data: {
        blocks: updatedBlocks,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Block aktualisiert",
      block: updatedBlock
    })
  } catch (error: any) {
    console.error("Error updating block:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/app/dpp/[dppId]/content/blocks/[blockId]
 * 
 * Deletes a block
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dppId: string; blockId: string }> }
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

    // Load existing content
    const existingContent = await prisma.dppContent.findFirst({
      where: {
        dppId: resolvedParams.dppId,
        isPublished: false
      }
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: "Content nicht gefunden" },
        { status: 404 }
      )
    }

    const blocks = (existingContent.blocks as Block[]) || []
    const filteredBlocks = blocks.filter(b => b.id !== resolvedParams.blockId)

    if (filteredBlocks.length === blocks.length) {
      return NextResponse.json(
        { error: "Block nicht gefunden" },
        { status: 404 }
      )
    }

    // Reorder remaining blocks and ensure valid status
    const reorderedBlocks = filteredBlocks.map((block, index) => ({
      ...block,
      order: index,
      // Ensure status is always "draft" or "published" (default to "draft" if missing or invalid)
      status: (block.status === "draft" || block.status === "published") 
        ? block.status 
        : "draft"
    }))

    // Save updated content
    await prisma.dppContent.update({
      where: { id: existingContent.id },
      data: {
        blocks: reorderedBlocks,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Block gelöscht"
    })
  } catch (error: any) {
    console.error("Error deleting block:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

