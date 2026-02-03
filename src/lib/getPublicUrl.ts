import { getBaseUrl } from "./getBaseUrl"

/**
 * Helper-Funktion zur Generierung absoluter Public URLs
 * 
 * Konvertiert einen relativen Pfad (z.B. "/public/dpp/...") zu einer absoluten URL.
 * Unterstützt auch bestehende absolute URLs in der DB (Backward-Kompatibilität).
 * 
 * @param publicPathOrUrl - Relativer Pfad (z.B. "/public/dpp/{id}/v/{version}") oder bereits absolute URL
 * @returns Absolute URL (z.B. "https://dpp-kappa.vercel.app/public/dpp/...")
 */
export function getPublicUrl(publicPathOrUrl: string | null | undefined): string | null {
  if (!publicPathOrUrl) {
    return null
  }

  // Wenn bereits absolute URL: Domain für Anzeige/QR auf easyproductpass.com normalisieren
  if (publicPathOrUrl.startsWith("http://") || publicPathOrUrl.startsWith("https://")) {
    const url = publicPathOrUrl.replace(/https?:\/\/dpp-kappa\.vercel\.app(\/|$)/gi, "https://easyproductpass.com$1")
    return url
  }

  // Relativer Pfad: Generiere absolute URL mit getBaseUrl()
  const baseUrl = getBaseUrl()
  return `${baseUrl}${publicPathOrUrl.startsWith("/") ? publicPathOrUrl : `/${publicPathOrUrl}`}`
}

