import { authenticator } from "otplib"

/**
 * TOTP (Time-based One-Time Password) Helper-Funktionen
 * Verwendet für Zwei-Faktor-Authentifizierung (2FA)
 */

/**
 * Generiert ein neues TOTP-Secret
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

/**
 * Generiert eine TOTP-URL für QR-Code-Generierung
 */
export function generateTotpUrl(secret: string, email: string, issuer: string = "Easy Pass"): string {
  return authenticator.keyuri(email, issuer, secret)
}

/**
 * Verifiziert einen TOTP-Code gegen ein Secret
 * 
 * @param token - Der 6-stellige TOTP-Code vom User
 * @param secret - Das TOTP-Secret aus der Datenbank
 * @returns true wenn Code gültig ist, false sonst
 */
export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    // Validierung: Secret muss vorhanden sein
    if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
      return false
    }

    // Code normalisieren: trimmen und nur Ziffern behalten
    const normalizedToken = String(token || "").trim().replace(/\D/g, "")
    
    // Code muss genau 6 Ziffern haben
    if (normalizedToken.length !== 6) {
      return false
    }

    // Secret normalisieren
    const normalizedSecret = secret.trim()

    // TOTP-Verifizierung mit Window von 2 (±60 Sekunden Toleranz)
    // Das berücksichtigt größere Zeitabweichungen zwischen Server und Client
    // Temporär Window setzen, dann zurücksetzen
    const originalWindow = authenticator.options.window || 1
    authenticator.options.window = 2
    try {
      return authenticator.check(normalizedToken, normalizedSecret)
    } finally {
      authenticator.options.window = originalWindow
    }
  } catch (error) {
    // Bei jedem Fehler: Code als ungültig zurückgeben
    return false
  }
}

/**
 * Generiert einen QR-Code für die TOTP-Einrichtung
 */
export async function generateTotpQrCode(otpUrl: string): Promise<string> {
  const QRCode = (await import("qrcode")).default
  return QRCode.toDataURL(otpUrl)
}

