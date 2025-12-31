export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { extractTextFromUrl } from "@/lib/preflight/text-extractor"
import { analyzePreflight, calculateOverallScore, normalizeCategory } from "@/lib/preflight/openai-service"
import { PreflightResponse } from "@/lib/preflight/types"
import { hasFeature } from "@/lib/capabilities/resolver"

/**
 * POST /api/app/dpps/preflight/url
 * 
 * Preflight-Analyse für Website-URL
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    // Feature-Check: AI Analysis muss verfügbar sein
    const canUseAiAnalysis = await hasFeature("ai_analysis", {
      organizationId: user.organizationId,
      userId: session.user.id,
    })

    if (!canUseAiAnalysis) {
      return NextResponse.json(
        { error: "KI-Analyse ist für Ihre Subscription nicht verfügbar" },
        { status: 403 }
      )
    }

    // Parse JSON Body
    let body: { url?: string }
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: "Ungültiges JSON" },
        { status: 400 }
      )
    }

    const { url } = body

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json(
        { error: "URL ist erforderlich" },
        { status: 400 }
      )
    }

    // Validiere URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Ungültige URL" },
        { status: 400 }
      )
    }

    // Text extrahieren
    let extractedText: string
    try {
      extractedText = await extractTextFromUrl(url.trim())
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Website-Extraktion fehlgeschlagen" },
        { status: 400 }
      )
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Kein Text konnte von der Website extrahiert werden" },
        { status: 400 }
      )
    }

    // AI-Analyse: Verwende Standard-Felder für alle Kategorien
    const standardRequiredFields = ["name", "sku", "brand", "countryOfOrigin", "materials"]

    let analysisResult
    try {
      analysisResult = await analyzePreflight(extractedText, standardRequiredFields)
    } catch (error) {
      console.error("AI Analysis error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "AI-Analyse fehlgeschlagen" },
        { status: 500 }
      )
    }

    // Normalisiere Kategorie
    const normalizedCategory = normalizeCategory(analysisResult.detectedCategory)

    // Berechne overallScore
    const overallScore = calculateOverallScore(analysisResult.results)

    // Erstelle Response
    const response: PreflightResponse = {
      detectedCategory: normalizedCategory,
      overallScore,
      results: analysisResult.results,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error("Preflight URL error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

