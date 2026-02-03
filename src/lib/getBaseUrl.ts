/**
 * Zentrale Base-URL-Helper-Funktion
 * 
 * Liefert die korrekte Base-URL für die aktuelle Umgebung:
 * - Production: NEXT_PUBLIC_APP_URL (falls gesetzt)
 * - Vercel Preview/Production: VERCEL_URL (automatisch von Vercel gesetzt)
 * - Local Development: http://localhost:3000
 * 
 * @returns Base URL als String (z.B. "https://dpp-kappa.vercel.app" oder "http://localhost:3000")
 */
export function getBaseUrl(): string {
  // Explizite App-URL (empfohlen für Production)
  // Sollte in Vercel Environment Variables gesetzt werden für Production
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Vercel Preview / Production Fallback
  // Alte Vercel-Domain auf Produktions-Domain mappen (URLs/QR-Codes zeigen easyproductpass.com)
  if (process.env.VERCEL_URL === "dpp-kappa.vercel.app") {
    return "https://easyproductpass.com"
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local Development Fallback
  return "http://localhost:3000"
}

