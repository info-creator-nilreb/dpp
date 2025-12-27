/**
 * Text-Extraktions-Utilities für PDF und Websites
 * 
 * HARDENED: Enforces HARD LIMIT on extracted text length (max 12,000 characters)
 * Truncates safely: beginning + middle + end (not just beginning)
 */

import { load } from "cheerio"

// HARD LIMIT - Must NOT be exceeded
const MAX_TEXT_LENGTH = 12000
const FETCH_TIMEOUT_MS = 10000 // 10 seconds

/**
 * Extrahiert Text aus einem PDF-Buffer
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    // pdf-parse v1.x uses a simple function-based API (no worker needed)
    // Ensure we have a proper Buffer (not a string or other type)
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error("PDF-Daten müssen ein Buffer sein")
    }
    if (pdfBuffer.length === 0) {
      throw new Error("PDF-Buffer ist leer")
    }
    
    const pdfParse = require("pdf-parse")
    const data = await pdfParse(pdfBuffer)
    let text = data.text || ""
    
    // Bereinige Text: Entferne übermäßige Whitespaces
    text = text.replace(/\s+/g, " ").trim()
    
    // Truncate auf Max-Länge
    if (text.length > MAX_TEXT_LENGTH) {
      text = truncateText(text, MAX_TEXT_LENGTH)
    }
    
    return text
  } catch (error) {
    throw new Error(`PDF-Extraktion fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
  }
}

/**
 * Extrahiert sichtbaren Text von einer Website
 */
export async function extractTextFromUrl(url: string): Promise<string> {
  try {
    // Validiere URL
    const urlObj = new URL(url)
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Nur HTTP/HTTPS URLs sind erlaubt")
    }

    // Fetch HTML with timeout
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DPP-Preflight/1.0)"
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Parse mit Cheerio
    const $ = load(html)
    
    // Entferne Scripts, Styles, Navigation, Footer
    $("script, style, nav, footer, header").remove()
    
    // Extrahiere Text aus body
    let text = $("body").text() || ""
    
    // Bereinige Text: Entferne übermäßige Whitespaces
    text = text.replace(/\s+/g, " ").trim()
    
    // Truncate auf Max-Länge
    if (text.length > MAX_TEXT_LENGTH) {
      text = truncateText(text, MAX_TEXT_LENGTH)
    }
    
    return text
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("URL-Zugriff hat das Zeitlimit überschritten")
    }
    throw new Error(`Website-Extraktion fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
  }
}

/**
 * Truncate Text: Safely preserves beginning + middle + end
 * 
 * Strategy: 40% beginning, 20% middle, 40% end
 * This ensures critical information at start and end is retained
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  // Calculate portions: 40% beginning, 20% middle, 40% end
  const startLength = Math.floor(maxLength * 0.4)
  const endLength = Math.floor(maxLength * 0.4)
  const middleLength = maxLength - startLength - endLength

  const start = text.substring(0, startLength)
  const middle = text.substring(
    Math.floor((text.length - middleLength) / 2),
    Math.floor((text.length + middleLength) / 2)
  )
  const end = text.substring(text.length - endLength)

  return `${start}...${middle}...${end}`
}

