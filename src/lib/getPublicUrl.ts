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

  // Wenn bereits absolute URL (beginnt mit http:// oder https://), direkt verwenden
  // Dies unterstützt bestehende Einträge in der DB (Backward-Kompatibilität)
  if (publicPathOrUrl.startsWith("http://") || publicPathOrUrl.startsWith("https://")) {
    return publicPathOrUrl
  }

  // Relativer Pfad: Generiere absolute URL mit getBaseUrl()
  const baseUrl = getBaseUrl()
  return `${baseUrl}${publicPathOrUrl.startsWith("/") ? publicPathOrUrl : `/${publicPathOrUrl}`}`
}

