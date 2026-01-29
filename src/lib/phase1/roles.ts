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
 * Deutsche Bezeichnungen für Rollen (für UI)
 */
export const ROLE_LABELS: Record<Phase1Role, string> = {
  [PHASE1_ROLES.ORG_ADMIN]: "Organisationseigentümer",
  [PHASE1_ROLES.EDITOR]: "Bearbeiter",
  [PHASE1_ROLES.VIEWER]: "Leser",
}

/**
 * Konvertiert eine Rolle in ihre deutsche Bezeichnung
 * Unterstützt auch Legacy-Rollen wie ORG_OWNER (wird zu ORG_ADMIN gemappt)
 */
export function getRoleLabel(role: Phase1Role | string | null): string {
  if (!role) return "Unbekannt"
  
  // Legacy-Rollen-Mapping: ORG_OWNER → ORG_ADMIN
  if (role === "ORG_OWNER") {
    return ROLE_LABELS[PHASE1_ROLES.ORG_ADMIN]
  }
  
  if (role in ROLE_LABELS) {
    return ROLE_LABELS[role as Phase1Role]
  }
  return role
}

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

