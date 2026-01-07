import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { latestPublishedTemplate } from "@/lib/template-helpers"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/app/dpp/[dppId]/template
 * 
 * Lädt das Template für einen DPP basierend auf dessen Kategorie
 */
export async function GET(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { dppId } = params

    // Lade DPP, um die Kategorie zu erhalten
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      select: { category: true }
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Lade Template für die Kategorie
    const template = await latestPublishedTemplate(dpp.category)

    if (!template) {
      return NextResponse.json(
        { error: `Kein Template für die Kategorie "${dpp.category}" gefunden` },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("Error loading template for DPP:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

