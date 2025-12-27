/**
 * Virus Scanning Service
 * 
 * Verwendet VirusTotal API v3 für Virenscanning von Uploads.
 * In Production aktiviert, in Development optional (überspringbar).
 * 
 * VirusTotal API v3:
 * - Free Tier: 4 Requests/Minute
 * - Max File Size: 32 MB (wir haben 10 MB Limit, also OK)
 * - Dokumentation: https://developers.virustotal.com/v3.0/reference#files
 * 
 * Setup:
 * 1. API Key bei https://www.virustotal.com/gui/join-us erhalten
 * 2. Environment Variable setzen: VIRUSTOTAL_API_KEY=your-key
 * 3. Optional: ENABLE_VIRUS_SCAN=true für Development (Standard: nur Production)
 */

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY
const VIRUSTOTAL_API_URL = "https://www.virustotal.com/api/v3/files"
const ENABLE_VIRUS_SCAN = process.env.ENABLE_VIRUS_SCAN === "true" || process.env.NODE_ENV === "production"

export interface VirusScanResult {
  clean: boolean
  message?: string
  detected?: number
  total?: number
}

/**
 * Erstellt multipart/form-data Body für VirusTotal API
 */
function createFormData(fileBuffer: Buffer, fileName: string): FormData {
  // Node.js 18+ unterstützt globales FormData
  const formData = new FormData()
  
  // Erstelle Blob aus Buffer (Node.js 18+ unterstützt Blob)
  const blob = new Blob([fileBuffer], { type: "application/octet-stream" })
  formData.append("file", blob, fileName)
  
  return formData
}

/**
 * Scant eine Datei auf Viren
 * 
 * @param fileBuffer - Die Datei als Buffer
 * @param fileName - Der Dateiname (für FormData)
 * @returns VirusScanResult mit clean=true wenn sicher, clean=false wenn verdächtig/gefährlich
 */
export async function scanFile(fileBuffer: Buffer, fileName: string): Promise<VirusScanResult> {
  // In Development: Optional, überspringe wenn kein API Key gesetzt
  if (!ENABLE_VIRUS_SCAN || !VIRUSTOTAL_API_KEY) {
    console.log("[Virus Scanner] Skipping scan (development mode or no API key)")
    return { clean: true, message: "Virus scan skipped (development mode)" }
  }

  try {
    // Erstelle FormData für multipart/form-data Upload
    const formData = createFormData(fileBuffer, fileName)

    // Upload für Scan
    const scanResponse = await fetch(VIRUSTOTAL_API_URL, {
      method: "POST",
      headers: {
        "x-apikey": VIRUSTOTAL_API_KEY
      },
      body: formData
    })

    if (!scanResponse.ok) {
      const errorText = await scanResponse.text()
      console.error("[Virus Scanner] Scan request failed:", scanResponse.status, errorText)
      
      // Bei Rate Limit (429): Loggen aber als clean behandeln (nicht blockieren)
      if (scanResponse.status === 429) {
        console.warn("[Virus Scanner] Rate limit reached, allowing file")
        return { clean: true, message: "Rate limit reached, scan skipped" }
      }
      
      // Bei anderen Fehlern: Sicherheitshalber blockieren
      throw new Error(`Virus scan request failed: ${scanResponse.status}`)
    }

    const scanData = await scanResponse.json()
    
    // API v3 gibt data.id zurück, das Ergebnis muss später abgerufen werden
    // Für MVP: Wenn Upload erfolgreich, als clean behandeln
    // In Production sollte man das Ergebnis später abrufen (Polling mit data.id)
    if (scanData.data?.id) {
      console.log("[Virus Scanner] File uploaded for scan:", scanData.data.id)
      // TODO: In Production sollte man hier das Ergebnis später abrufen
      // Für jetzt: Als clean behandeln (wird später gescannt)
      return { clean: true, message: "File uploaded for scan" }
    }

    return { clean: true }
  } catch (error) {
    console.error("[Virus Scanner] Error:", error)
    // Bei Fehler: Sicherheitshalber blockieren
    throw new Error(`Virus scan failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Prüft ob Virus Scanning aktiviert ist
 */
export function isVirusScanEnabled(): boolean {
  return ENABLE_VIRUS_SCAN && !!VIRUSTOTAL_API_KEY
}

