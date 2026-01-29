/**
 * API Route: GET /api/app/dpp/[dppId]/unified-blocks
 * 
 * Transformiert DPP zu UnifiedContentBlocks für die Vorschau
 * Kombiniert Template-Blöcke und CMS-Blöcke
 */

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { transformDppToUnified } from "@/lib/content-adapter/dpp-transformer"
import { requireViewDPP } from "@/lib/api-permissions"

export const dynamic = "force-dynamic"

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

    // Prüfe Berechtigung
    const permissionError = await requireViewDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) {
      return permissionError
    }

    // Transformiere DPP zu UnifiedContentBlocks
    // Für Vorschau: includeVersionInfo = false, damit auch Draft-Blöcke angezeigt werden
    const unifiedBlocks = await transformDppToUnified(resolvedParams.dppId, {
      includeVersionInfo: false // Vorschau zeigt auch Draft-Blöcke
    })

    return NextResponse.json({ blocks: unifiedBlocks }, { status: 200 })
  } catch (error: any) {
    console.error("[UnifiedBlocks API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Transformieren der Blöcke" },
      { status: 500 }
    )
  }
}
