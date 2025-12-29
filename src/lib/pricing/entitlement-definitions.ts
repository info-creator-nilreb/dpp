/**
 * ENTITLEMENT DEFINITIONS
 * 
 * UI-only mapping layer for entitlement keys to product-facing labels
 * Technical keys remain unchanged - this is purely for UX
 */

export interface EntitlementDefinition {
  key: string
  label: string
  description: string
  unit: string
  icon?: string // Optional icon identifier
}

/**
 * Mapping of technical entitlement keys to product-facing definitions
 * 
 * IMPORTANT: Technical keys MUST NOT be changed
 * Only UI labels, descriptions, and units are defined here
 */
export const ENTITLEMENT_DEFINITIONS: Record<string, EntitlementDefinition> = {
  max_published_dpp: {
    key: "max_published_dpp",
    label: "Veröffentlichte Digitale Produktpässe",
    description: "Maximale Anzahl von Digital Product Passes, die veröffentlicht werden können",
    unit: "count",
    icon: "dpp"
  },
  max_storage_gb: {
    key: "max_storage_gb",
    label: "Speicherplatz",
    description: "Wie viel Speicherplatz steht für Medien und Dokumente zur Verfügung",
    unit: "GB",
    icon: "storage"
  },
  max_users: {
    key: "max_users",
    label: "Team-Mitglieder",
    description: "Wie viele Benutzer haben Zugriff auf diese Organisation",
    unit: "count",
    icon: "users"
  }
}

/**
 * Get entitlement definition for a key
 * Returns default if not found
 */
export function getEntitlementDefinition(key: string): EntitlementDefinition {
  return ENTITLEMENT_DEFINITIONS[key] || {
    key,
    label: key,
    description: `Limit für ${key}`,
    unit: "count"
  }
}

/**
 * Get all entitlement definitions
 */
export function getAllEntitlementDefinitions(): EntitlementDefinition[] {
  return Object.values(ENTITLEMENT_DEFINITIONS)
}

