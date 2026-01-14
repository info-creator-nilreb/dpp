import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/dpp/[dppId]/supplier-config
 * Lädt Supplier-Configs für alle Blöcke eines DPPs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dppId } = params

    // Prüfe, ob DPP existiert und User Zugriff hat
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

    // Prüfe Berechtigung
    const hasAccess = dpp.organization.memberships.length > 0 || 
                     dpp.organization.ownerId === session.user.id
    if (!hasAccess) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    // Lade Supplier-Configs
    const configs = await prisma.dppBlockSupplierConfig.findMany({
      where: { dppId }
    })

    // Transform zu Record<blockId, config>
    const configMap = configs.reduce((acc, config) => {
      const allowedRoles: string[] = Array.isArray(config.allowedRoles) 
        ? config.allowedRoles 
        : []
      
      acc[config.blockId] = {
        enabled: config.enabled,
        mode: config.mode as "input" | "declaration" | null,
        allowedRoles
      }
      return acc
    }, {} as Record<string, { enabled: boolean; mode: "input" | "declaration" | null; allowedRoles: string[] }>)

    // Transform zu Array für Response
    const configArray = Object.entries(configMap).map(([blockId, config]) => ({
      blockId,
      ...config
    }))

    return NextResponse.json({ configs: configArray })
  } catch (error: any) {
    console.error("Error fetching supplier configs:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Supplier-Configs" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/dpp/[dppId]/supplier-config
 * Speichert/aktualisiert Supplier-Config für einen Block
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dppId } = params
    const { blockId, enabled, mode, allowedRoles } = await request.json()

    if (!blockId) {
      return NextResponse.json(
        { error: "blockId ist erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe, ob DPP existiert und User Zugriff hat
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

    // Prüfe Berechtigung
    const hasAccess = dpp.organization.memberships.length > 0 || 
                     dpp.organization.ownerId === session.user.id
    if (!hasAccess) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    // Lade Template über Kategorie (optional - für Validierung)
    const template = await prisma.template.findFirst({
      where: {
        category: dpp.category,
        status: "active"
      },
      include: {
        blocks: true
      },
      orderBy: {
        version: "desc"
      }
    })

    // Wenn Template gefunden wurde, validiere Block
    if (template) {
      const block = template.blocks.find(b => b.id === blockId)
      if (block) {
        // Validierung: Block darf nicht order === 0 sein (Produktidentität)
        if (block.order === 0) {
          return NextResponse.json(
            { error: "Basisdaten-Block kann keine Lieferanten-Konfiguration haben" },
            { status: 400 }
          )
        }
      }
      // Wenn Block nicht im Template gefunden wurde, trotzdem erlauben (könnte ein CMS-Block sein)
    }
    // Wenn kein Template gefunden wurde, trotzdem erlauben (könnte ein CMS-basierter DPP sein)

    // Speichere/aktualisiere Config
    await prisma.dppBlockSupplierConfig.upsert({
      where: {
        dppId_blockId: {
          dppId,
          blockId
        }
      },
      update: {
        enabled: enabled ?? false,
        mode: mode || null,
        allowedRoles: allowedRoles && allowedRoles.length > 0 ? allowedRoles : null
      },
      create: {
        dppId,
        blockId,
        enabled: enabled ?? false,
        mode: mode || null,
        allowedRoles: allowedRoles && allowedRoles.length > 0 ? allowedRoles : null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error saving supplier config:", error)
    return NextResponse.json(
      { error: "Fehler beim Speichern der Supplier-Config" },
      { status: 500 }
    )
  }
}

