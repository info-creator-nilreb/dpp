export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { extractTextFromPdf } from "@/lib/preflight/text-extractor"
import { analyzePreflight, calculateOverallScore, normalizeCategory } from "@/lib/preflight/openai-service"
import { PreflightResponse } from "@/lib/preflight/types"
import { scanFile } from "@/lib/virus-scanner"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * POST /api/app/dpps/preflight/pdf
 * 
 * Preflight-Analyse für PDF-Upload
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

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      )
    }

    // Validierung: Dateityp
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Nur PDF-Dateien sind erlaubt" },
        { status: 400 }
      )
    }

    // Validierung: Dateigröße
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Datei zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    // PDF zu Buffer konvertieren
    const arrayBuffer = await file.arrayBuffer()
    // Ensure we create a proper Node.js Buffer from the ArrayBuffer
    const pdfBuffer = Buffer.from(arrayBuffer)
    
    // Validate buffer
    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      return NextResponse.json({ error: "PDF-Daten konnten nicht geladen werden" }, { status: 400 })
    }

    // Virus Scan (nur in Production, überspringbar in Development)
    try {
      await scanFile(pdfBuffer, file.name)
    } catch (scanError) {
      console.error("[Preflight PDF] Virus scan failed:", scanError)
      return NextResponse.json(
        { error: "Datei konnte nicht auf Viren geprüft werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support." },
        { status: 400 }
      )
    }

    // Text extrahieren
    let extractedText: string
    try {
      extractedText = await extractTextFromPdf(pdfBuffer)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "PDF-Extraktion fehlgeschlagen" },
        { status: 400 }
      )
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Kein Text konnte aus dem PDF extrahiert werden" },
        { status: 400 }
      )
    }

    // AI-Analyse: Verwende Standard-Felder für alle Kategorien
    // (Die AI wird die Kategorie erkennen und wir können dann später die richtigen Felder laden)
    const standardRequiredFields = ["name", "sku", "brand", "countryOfOrigin", "materials"]

    let analysisResult
    try {
      analysisResult = await analyzePreflight(extractedText, standardRequiredFields)
    } catch (error) {
      console.error("AI Analysis error:", error)
      const errorMessage = error instanceof Error ? error.message : "AI-Analyse fehlgeschlagen"
      const errorStack = error instanceof Error ? error.stack : undefined
      console.error("AI Analysis error stack:", errorStack)
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Normalisiere Kategorie
    const normalizedCategory = normalizeCategory(analysisResult.detectedCategory)

    // Lade required fields für erkannte Kategorie (für zukünftige Erweiterung)
    // Aktuell verwenden wir die Standard-Felder für alle Kategorien
    // const requiredFields = await getRequiredFieldsForCategory(normalizedCategory.key)

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
    console.error("Preflight PDF error:", error)
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Error stack:", errorStack)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

