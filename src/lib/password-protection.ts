/**
 * Password Protection (Closed Alpha / Pre-Launch)
 *
 * Konfiguration für das globale Passwort-Tor.
 * Kann später um DB- oder Env-Persistenz erweitert werden.
 */

export interface PasswordProtectionConfig {
  passwordProtectionEnabled?: boolean
  passwordProtectionStartDate?: string | null
  passwordProtectionEndDate?: string | null
  passwordProtectionSessionTimeoutMinutes?: number
}

/**
 * Liefert die aktuelle Password-Protection-Konfiguration.
 * Standard: aus Umgebungsvariablen oder Defaults.
 */
export async function getPasswordProtectionConfig(): Promise<PasswordProtectionConfig | null> {
  const enabled = process.env.PASSWORD_PROTECTION_ENABLED === "true"
  const startDate = process.env.PASSWORD_PROTECTION_START_DATE?.trim() || null
  const endDate = process.env.PASSWORD_PROTECTION_END_DATE?.trim() || null
  const timeoutMinutes = process.env.PASSWORD_PROTECTION_SESSION_TIMEOUT_MINUTES
    ? parseInt(process.env.PASSWORD_PROTECTION_SESSION_TIMEOUT_MINUTES, 10)
    : 60

  return {
    passwordProtectionEnabled: enabled,
    passwordProtectionStartDate: startDate,
    passwordProtectionEndDate: endDate,
    passwordProtectionSessionTimeoutMinutes: Number.isFinite(timeoutMinutes) ? timeoutMinutes : 60,
  }
}
