/**
 * OpenAI Service für DPP Preflight Analysis
 * 
 * HARDENED VERSION:
 * - Deterministic AI behavior
 * - Predictable costs
 * - Minimal legal and operational risk
 */

// @ts-ignore - OpenAI package types may not be recognized immediately after install
import OpenAI from "openai"
import { AIAnalysisResponse, PreflightResult, DetectedCategory } from "./types"

// ============================================================================
// MODEL CONFIGURATION (MANDATORY - NOT OVERRIDABLE)
// ============================================================================

const MODEL = "gpt-4.1" // Responses API model
const TEMPERATURE = 0
const MAX_OUTPUT_TOKENS = 900
const REQUEST_TIMEOUT_MS = 10000 // 10 seconds

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (openai) {
    return openai
  }

  const OPENAI_API_KEY: string | undefined = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim().length === 0) {
    throw new Error("OPENAI_API_KEY environment variable is required but not set or empty")
  }

  // No fallback keys, no hardcoded secrets
  try {
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 0, // No automatic retries - we handle retries explicitly
    })
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error)
    throw new Error(`Failed to initialize OpenAI client: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  return openai
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

const MAX_INPUT_TEXT_LENGTH = 12000

function validateInputText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error("Extrahiertes Text ist leer")
  }

  if (text.length > MAX_INPUT_TEXT_LENGTH) {
    throw new Error(`Text überschreitet Maximum von ${MAX_INPUT_TEXT_LENGTH} Zeichen`)
  }
}

// ============================================================================
// REQUEST ID GENERATION (for logging)
// ============================================================================

function generateRequestId(): string {
  return `preflight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// ============================================================================
// LOGGING (Observability only - NO sensitive data)
// ============================================================================

interface LogEntry {
  requestId: string
  duration: number
  model: string
  success: boolean
  error?: string
  tokenUsage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

function logRequest(entry: LogEntry): void {
  // Structured logging - ONLY metadata, NO prompts or responses
  const logData = {
    service: "preflight-ai",
    requestId: entry.requestId,
    duration: `${entry.duration}ms`,
    model: entry.model,
    success: entry.success,
    ...(entry.error && { error: entry.error }),
    ...(entry.tokenUsage && { tokens: entry.tokenUsage }),
  }

  if (entry.success) {
    console.log("[PREFLIGHT-AI]", JSON.stringify(logData))
  } else {
    console.error("[PREFLIGHT-AI]", JSON.stringify(logData))
  }
}

// ============================================================================
// CONSERVATIVE BIAS ENFORCEMENT
// ============================================================================

/**
 * Post-processing safeguard: Downgrade ambiguous or low-confidence results
 * Never upgrade optimistically. Always prefer UNCLEAR > ASSUMED.
 */
function applyConservativeBias(results: PreflightResult[]): PreflightResult[] {
  return results.map((result) => {
    // If confidence < 0.5, downgrade to YELLOW or RED
    if (result.confidence < 0.5) {
      // If it was GREEN, downgrade to YELLOW
      if (result.status === "GREEN") {
        return {
          ...result,
          status: "YELLOW",
          comment: `${result.comment} (Hinweis: Niedrige Konfidenz, daher abgestuft)`,
        }
      }
      // If it was YELLOW, downgrade to RED if confidence is very low
      if (result.status === "YELLOW" && result.confidence < 0.3) {
        return {
          ...result,
          status: "RED",
          comment: `${result.comment} (Hinweis: Sehr niedrige Konfidenz, daher abgestuft)`,
        }
      }
    }

    return result
  })
}

// ============================================================================
// AI CALL (Single call with timeout protection)
// ============================================================================

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  requestId: string
): Promise<{ content: string; tokenUsage?: LogEntry["tokenUsage"] }> {
  const startTime = Date.now()

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim().length === 0) {
      throw new Error("OPENAI_API_KEY environment variable is required but not set or empty")
    }

    // Combine system and user prompts for Responses API (single input string)
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`

    // MANDATORY configuration - Responses API parameters
    // Using direct HTTP call to /v1/responses endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: combinedPrompt,
          temperature: TEMPERATURE,
          max_output_tokens: MAX_OUTPUT_TOKENS,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `OpenAI API Fehler: HTTP ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorMessage
        } catch {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 200)}`
        }

        logRequest({
          requestId,
          duration,
          model: MODEL,
          success: false,
          error: errorMessage,
        })
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      // Extract output text from Responses API response
      // Responses API returns: { output_text: string, ... } or { output: [...] }
      const responseContent =
        responseData.output_text ??
        responseData.output?.[0]?.content?.[0]?.text ??
        responseData.output?.[0]?.text ??
        ""

      if (!responseContent || typeof responseContent !== "string" || responseContent.trim().length === 0) {
        const error = "Keine Antwort von OpenAI erhalten"
        logRequest({
          requestId,
          duration,
          model: MODEL,
          success: false,
          error,
        })
        throw new Error(error)
      }

      // Extract token usage if available (Responses API may return usage differently)
      const tokenUsage = responseData.usage
        ? {
            promptTokens: responseData.usage.prompt_tokens,
            completionTokens: responseData.usage.completion_tokens,
            totalTokens: responseData.usage.total_tokens,
          }
        : undefined

      logRequest({
        requestId,
        duration,
        model: MODEL,
        success: true,
        tokenUsage,
      })

      return { content: responseContent, tokenUsage }
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error: unknown) {
    const duration = Date.now() - startTime
    let errorMessage = "Unbekannter Fehler bei OpenAI API"

    if (error instanceof Error) {
      // Handle timeout
      if (error.name === "AbortError" || error.message.includes("timeout") || error.message.includes("aborted")) {
        errorMessage = "OpenAI API Request Timeout"
      } else {
        errorMessage = error.message
      }
    }

    logRequest({
      requestId,
      duration,
      model: MODEL,
      success: false,
      error: errorMessage,
    })

    throw new Error(errorMessage)
  }
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Führt Preflight-Analyse mit OpenAI durch
 * 
 * SINGLE-CALL RULE: Only ONE AI call per request (except retry on JSON parse failure)
 */
export async function analyzePreflight(
  extractedText: string,
  requiredFields: string[]
): Promise<AIAnalysisResponse> {
  const requestId = generateRequestId()

  // Input validation
  validateInputText(extractedText)

  // Create prompts
  const systemPrompt = `Du bist ein regulatorischer Preflight-Assistent für Digitale Produktpässe.
WICHTIG: Alle Analyse-Ergebnisse, Erklärungen und Feldwerte MÜSSEN auf Deutsch generiert werden,
auch wenn die Quelldaten auf Englisch oder gemischtsprachig sind.

Regeln:
- Erfinde keine Informationen
- Wenn Daten fehlen oder unklar sind, markiere sie als fehlend
- Sei konservativ
- Gib NUR gültiges JSON zurück
- ALLE Texte (comment, source) MÜSSEN auf Deutsch sein`

  const userPrompt = `Bestimme zuerst die wahrscheinlichste Produktkategorie.

Dann evaluiere basierend auf den Pflichtfeldern des entsprechenden DPP-Templates,
ob jedes Pflichtfeld im bereitgestellten Text vorhanden ist.

Regeln:
- Erfinde KEINE Werte
- Wenn unklar, verwende YELLOW oder RED
- Gib ein Ergebnis pro Pflichtfeld zurück
- ALLE Texte (comment, source) MÜSSEN auf Deutsch sein
- Werte in "source" müssen bereits normalisiert sein (keine Labels, keine beschreibenden Phrasen)

Zu prüfende Pflichtfelder: ${requiredFields.join(", ")}

Gib JSON in folgender Struktur zurück:

{
  "detectedCategory": {
    "key": "string",
    "confidence": number
  },
  "results": [
    {
      "field": "string",
      "status": "GREEN | YELLOW | RED",
      "confidence": number,
      "comment": "string (auf Deutsch)",
      "source": "string (bereits normalisierter Wert, auf Deutsch, keine Labels/Prefixes)"
    }
  ]
}

Text:
${extractedText}`

  // SINGLE AI CALL (with retry only on JSON parse failure)
  let analysisResponse: AIAnalysisResponse

  try {
    // First call
    const { content } = await callOpenAI(systemPrompt, userPrompt, requestId)
    analysisResponse = JSON.parse(content)
  } catch (parseError: unknown) {
    // Retry ONCE only if JSON parse failed (same prompt, same parameters)
    if (parseError instanceof SyntaxError || (parseError instanceof Error && parseError.name === "SyntaxError")) {
      try {
        const retryRequestId = `${requestId}-retry`
        const { content: retryContent } = await callOpenAI(systemPrompt, userPrompt, retryRequestId)
        analysisResponse = JSON.parse(retryContent)
      } catch (retryError: unknown) {
        // If retry also fails, return controlled error
        throw new Error("AI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.")
      }
    } else {
      // Re-throw non-parse errors
      throw parseError
    }
  }

  // Strict output validation
  try {
    validateAnalysisResponse(analysisResponse, requiredFields)
  } catch (validationError) {
    // If validation fails, return controlled error (do NOT expose raw AI output)
    throw new Error("AI-Antwort entspricht nicht dem erwarteten Format. Bitte versuchen Sie es erneut.")
  }

  // Apply conservative bias (downgrade ambiguous results)
  analysisResponse.results = applyConservativeBias(analysisResponse.results)

  return analysisResponse
}

// ============================================================================
// OUTPUT VALIDATION
// ============================================================================

/**
 * Validiert AI Response - Strict schema validation
 */
function validateAnalysisResponse(
  response: any,
  requiredFields: string[]
): asserts response is AIAnalysisResponse {
  if (!response || typeof response !== "object") {
    throw new Error("Ungültige AI Response: Kein Objekt")
  }

  if (!response.detectedCategory || typeof response.detectedCategory !== "object") {
    throw new Error("Ungültige AI Response: detectedCategory fehlt")
  }

  if (typeof response.detectedCategory.key !== "string") {
    throw new Error("Ungültige AI Response: detectedCategory.key fehlt")
  }

  if (typeof response.detectedCategory.confidence !== "number") {
    throw new Error("Ungültige AI Response: detectedCategory.confidence fehlt")
  }

  if (!Array.isArray(response.results)) {
    throw new Error("Ungültige AI Response: results ist kein Array")
  }

  // Prüfe ob alle required fields vorhanden sind
  const resultFields = new Set(response.results.map((r: any) => r.field))
  for (const requiredField of requiredFields) {
    if (!resultFields.has(requiredField)) {
      throw new Error(`Ungültige AI Response: Field "${requiredField}" fehlt in results`)
    }
  }

  // Validiere einzelne Results
  for (const result of response.results) {
    if (typeof result.field !== "string") {
      throw new Error("Ungültige AI Response: result.field muss string sein")
    }
    if (!["GREEN", "YELLOW", "RED"].includes(result.status)) {
      throw new Error(`Ungültige AI Response: result.status "${result.status}" ist ungültig`)
    }
    if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
      throw new Error("Ungültige AI Response: result.confidence muss zwischen 0 und 1 sein")
    }
    if (typeof result.comment !== "string") {
      throw new Error("Ungültige AI Response: result.comment muss string sein")
    }
    if (typeof result.source !== "string") {
      throw new Error("Ungültige AI Response: result.source muss string sein")
    }
  }
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Berechnet overallScore aus Results
 */
export function calculateOverallScore(results: PreflightResult[]): number {
  if (results.length === 0) {
    return 0
  }

  const greenCount = results.filter((r) => r.status === "GREEN").length
  const score = greenCount / results.length

  return Math.round(score * 100) / 100 // Auf 2 Dezimalstellen runden
}

// ============================================================================
// CATEGORY NORMALIZATION
// ============================================================================

/**
 * Normalisiert Kategorie-Key
 * Falls confidence < 0.6, verwende Fallback
 */
export function normalizeCategory(detectedCategory: DetectedCategory): DetectedCategory {
  if (detectedCategory.confidence < 0.6) {
    return {
      key: "generic_product",
      confidence: detectedCategory.confidence,
    }
  }

  // Normalisiere Kategorie-Keys zu bekannten Werten
  const categoryMap: Record<string, string> = {
    textiles_apparel: "TEXTILE",
    furniture: "FURNITURE",
    electronics: "OTHER",
    generic_product: "OTHER",
  }

  const normalizedKey =
    categoryMap[detectedCategory.key.toLowerCase()] || detectedCategory.key

  return {
    key: normalizedKey,
    confidence: detectedCategory.confidence,
  }
}
