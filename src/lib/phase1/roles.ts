/**
 * Phase 1: Rollen-Definitionen
 * 
 * Fix definierte Rollen:
 * - ORG_ADMIN: Vollzugriff auf Organisation
 * - EDITOR: Kann DPPs erstellen und bearbeiten
 * - VIEWER: Nur Leserechte
 */

export const PHASE1_ROLES = {
  ORG_ADMIN: "ORG_ADMIN",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const

export type Phase1Role = typeof PHASE1_ROLES[keyof typeof PHASE1_ROLES]

/**
 * Prüft ob eine Rolle gültig ist
 */
export function isValidPhase1Role(role: string): role is Phase1Role {
  return Object.values(PHASE1_ROLES).includes(role as Phase1Role)
}

/**
 * Default-Rolle für neue User
 */
export const DEFAULT_ROLE = PHASE1_ROLES.VIEWER

/**
 * Default-Rolle für Erstnutzer (Organisations-Ersteller)
 */
export const FIRST_USER_ROLE = PHASE1_ROLES.ORG_ADMIN

