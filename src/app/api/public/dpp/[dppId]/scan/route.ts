/**
 * POST /api/public/dpp/[dppId]/scan
 *
 * Erfasst einen Scan (Aufruf der öffentlichen DPP-Ansicht).
 * Kein Auth – wird vom Public-View beim ersten Laden aufgerufen.
 * Prüft: DPP existiert und ist PUBLISHED.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    if (!dppId) {
      return NextResponse.json({ error: "dppId fehlt" }, { status: 400 })
    }

    const body = await _request.json().catch(() => ({}))
    if (body?.fromApp === true) {
      return NextResponse.json({ ok: true })
    }
    const version = typeof body?.version === "number" ? body.version : null
    const region =
      typeof body?.region === "string" && body.region.trim() ? body.region.trim() : null

    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      select: { id: true, status: true },
    })

    if (!dpp || dpp.status !== "PUBLISHED") {
      return NextResponse.json({ error: "DPP nicht gefunden oder nicht veröffentlicht" }, { status: 404 })
    }

    await prisma.dppScan.create({
      data: {
        dppId,
        version: version ?? undefined,
        region: region ?? undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Public DPP Scan API] Error:", error)
    return NextResponse.json(
      { error: "Fehler beim Erfassen des Scans" },
      { status: 500 }
    )
  }
}
