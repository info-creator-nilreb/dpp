export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP, requireEditDPP } from "@/lib/api-permissions"

/**
 * GET /api/app/dpp/[dppId]/supplier-config
 *
 * Liefert die Block-Supplier-Konfiguration (durch Partner befüllbar) für diesen DPP.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireViewDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const configs = await prisma.dppBlockSupplierConfig.findMany({
      where: { dppId: resolvedParams.dppId },
    })

    const configsMap: Record<string, { enabled: boolean; mode: "input" | "declaration" | null; allowedRoles?: string[] }> = {}
    configs.forEach((c) => {
      configsMap[c.blockId] = {
        enabled: c.enabled,
        mode: (c.mode as "input" | "declaration") || null,
        allowedRoles: Array.isArray(c.allowedRoles) ? (c.allowedRoles as string[]) : [],
      }
    })

    return NextResponse.json({ configs: configsMap })
  } catch (error: any) {
    console.error("Error fetching supplier config:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/dpp/[dppId]/supplier-config
 *
 * Aktualisiert die Block-Supplier-Konfiguration.
 * Body: { configs: Record<blockId, { enabled: boolean, mode?: "input" | "declaration", allowedRoles?: string[] }> }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireEditDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const body = await request.json()
    const configs = body.configs as Record<string, { enabled: boolean; mode?: "input" | "declaration"; allowedRoles?: string[] }>
    if (!configs || typeof configs !== "object") {
      return NextResponse.json(
        { error: "configs (Objekt) ist erforderlich" },
        { status: 400 }
      )
    }

    const dppId = resolvedParams.dppId

    for (const [blockId, cfg] of Object.entries(configs)) {
      if (!blockId || typeof cfg !== "object") continue
      const enabled = !!cfg.enabled
      const mode = cfg.mode === "input" || cfg.mode === "declaration" ? cfg.mode : null
      const allowedRoles = Array.isArray(cfg.allowedRoles) ? cfg.allowedRoles : []

      await prisma.dppBlockSupplierConfig.upsert({
        where: {
          dppId_blockId: { dppId, blockId },
        },
        create: {
          dppId,
          blockId,
          enabled,
          mode,
          allowedRoles: allowedRoles.length ? allowedRoles : undefined,
        },
        update: {
          enabled,
          mode,
          allowedRoles: allowedRoles.length ? allowedRoles : undefined,
        },
      })
    }

    const updated = await prisma.dppBlockSupplierConfig.findMany({
      where: { dppId },
    })
    const configsMap: Record<string, { enabled: boolean; mode: "input" | "declaration" | null; allowedRoles?: string[] }> = {}
    updated.forEach((c) => {
      configsMap[c.blockId] = {
        enabled: c.enabled,
        mode: (c.mode as "input" | "declaration") || null,
        allowedRoles: Array.isArray(c.allowedRoles) ? (c.allowedRoles as string[]) : [],
      }
    })

    return NextResponse.json({ configs: configsMap })
  } catch (error: any) {
    console.error("Error updating supplier config:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
