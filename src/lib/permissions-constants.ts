/**
 * Permission Constants
 * 
 * Diese Datei enthält NUR Konstanten - keine Server-Only-Imports.
 * Kann sicher in Client Components importiert werden.
 */

/**
 * Rollen-Definitionen
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  EU_REGISTRY: "EU_REGISTRY",
} as const

export const ORGANIZATION_ROLES = {
  ORG_OWNER: "ORG_OWNER",
  ORG_ADMIN: "ORG_ADMIN",
  ORG_MEMBER: "ORG_MEMBER",
  ORG_VIEWER: "ORG_VIEWER",
} as const

export const EXTERNAL_ROLES = {
  SUPPLIER: "SUPPLIER",
  RECYCLER: "RECYCLER",
  REPAIR_SERVICE: "REPAIR_SERVICE",
} as const

export const PUBLIC_ROLE = "PUBLIC" as const

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES]
export type OrganizationRole = typeof ORGANIZATION_ROLES[keyof typeof ORGANIZATION_ROLES]
export type ExternalRole = typeof EXTERNAL_ROLES[keyof typeof EXTERNAL_ROLES]

/**
 * DPP-Sektionen für granulare Berechtigungen
 */
export const DPP_SECTIONS = {
  // Sektion 1: Basis- & Produktdaten
  BASIC_DATA: "basic_data",
  // Sektion 2: Materialien & Zusammensetzung
  MATERIALS: "materials",
  MATERIAL_SOURCE: "material_source",
  // Sektion 3: Nutzung, Pflege & Lebensdauer
  CARE: "care",
  REPAIR: "repair",
  LIFESPAN: "lifespan",
  // Sektion 4: Rechtliches & Konformität
  LEGAL: "legal",
  CONFORMITY: "conformity",
  DISPOSAL: "disposal",
  // Sektion 5: Rücknahme & Second Life
  TAKEBACK: "takeback",
  SECOND_LIFE: "second_life",
  // Medien
  MEDIA: "media",
} as const

export type DppSection = typeof DPP_SECTIONS[keyof typeof DPP_SECTIONS]

