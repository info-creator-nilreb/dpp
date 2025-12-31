/**
 * Phase 1.5: Organization Field Sensitivity Levels
 * 
 * Defines sensitivity levels for organization fields to enforce
 * appropriate confirmation flows for Super Admin changes.
 */

export type SensitivityLevel = "low" | "medium" | "high"

export interface FieldSensitivity {
  field: string
  level: SensitivityLevel
  label: string
  requiresConfirmation: boolean
  requiresReason: boolean
}

/**
 * Field Sensitivity Matrix
 * 
 * Level 1 (Low): No confirmation required
 * Level 2 (Medium): Confirmation required
 * Level 3 (High): Confirmation + reason required
 */
export const ORGANIZATION_FIELD_SENSITIVITY: Record<string, FieldSensitivity> = {
  // Level 1 - Low Risk (no confirmation)
  name: {
    field: "name",
    level: "low",
    label: "Name",
    requiresConfirmation: false,
    requiresReason: false,
  },
  displayName: {
    field: "displayName",
    level: "low",
    label: "Anzeigename",
    requiresConfirmation: false,
    requiresReason: false,
  },
  internalNotes: {
    field: "internalNotes",
    level: "low",
    label: "Interne Notizen",
    requiresConfirmation: false,
    requiresReason: false,
  },
  supportTags: {
    field: "supportTags",
    level: "low",
    label: "Support-Tags",
    requiresConfirmation: false,
    requiresReason: false,
  },

  // Level 2 - Medium Risk (confirmation required)
  legalName: {
    field: "legalName",
    level: "medium",
    label: "Rechtlicher Name",
    requiresConfirmation: true,
    requiresReason: false,
  },
  companyType: {
    field: "companyType",
    level: "medium",
    label: "Unternehmensform",
    requiresConfirmation: true,
    requiresReason: false,
  },
  addressStreet: {
    field: "addressStreet",
    level: "medium",
    label: "Straße",
    requiresConfirmation: true,
    requiresReason: false,
  },
  addressZip: {
    field: "addressZip",
    level: "medium",
    label: "PLZ",
    requiresConfirmation: true,
    requiresReason: false,
  },
  addressCity: {
    field: "addressCity",
    level: "medium",
    label: "Stadt",
    requiresConfirmation: true,
    requiresReason: false,
  },
  addressCountry: {
    field: "addressCountry",
    level: "medium",
    label: "Land (Adresse)",
    requiresConfirmation: true,
    requiresReason: false,
  },
  country: {
    field: "country",
    level: "medium",
    label: "Land (ISO)",
    requiresConfirmation: true,
    requiresReason: false,
  },
  commercialRegisterId: {
    field: "commercialRegisterId",
    level: "medium",
    label: "Handelsregisternummer",
    requiresConfirmation: true,
    requiresReason: false,
  },
  invoiceAddressStreet: {
    field: "invoiceAddressStreet",
    level: "medium",
    label: "Rechnungsadresse: Straße",
    requiresConfirmation: true,
    requiresReason: false,
  },
  invoiceAddressZip: {
    field: "invoiceAddressZip",
    level: "medium",
    label: "Rechnungsadresse: PLZ",
    requiresConfirmation: true,
    requiresReason: false,
  },
  invoiceAddressCity: {
    field: "invoiceAddressCity",
    level: "medium",
    label: "Rechnungsadresse: Stadt",
    requiresConfirmation: true,
    requiresReason: false,
  },
  invoiceAddressCountry: {
    field: "invoiceAddressCountry",
    level: "medium",
    label: "Rechnungsadresse: Land",
    requiresConfirmation: true,
    requiresReason: false,
  },
  billingCountry: {
    field: "billingCountry",
    level: "medium",
    label: "Rechnungsland (ISO)",
    requiresConfirmation: true,
    requiresReason: false,
  },
  licenseTier: {
    field: "licenseTier",
    level: "medium",
    label: "License Tier",
    requiresConfirmation: true,
    requiresReason: false,
  },

  // Level 3 - High Risk (confirmation + reason required)
  vatId: {
    field: "vatId",
    level: "high",
    label: "USt-IdNr.",
    requiresConfirmation: true,
    requiresReason: true,
  },
  billingEmail: {
    field: "billingEmail",
    level: "high",
    label: "Rechnungs-E-Mail",
    requiresConfirmation: true,
    requiresReason: true,
  },
  billingContactUserId: {
    field: "billingContactUserId",
    level: "high",
    label: "Rechnungs-Kontakt",
    requiresConfirmation: true,
    requiresReason: true,
  },
  status: {
    field: "status",
    level: "high",
    label: "Status",
    requiresConfirmation: true,
    requiresReason: true,
  },
  // Phase 1.8: Subscription fields (critical)
  subscriptionStatus: {
    field: "subscriptionStatus",
    level: "high",
    label: "Subscription Status",
    requiresConfirmation: true,
    requiresReason: true,
  },
  subscriptionPlanId: {
    field: "subscriptionPlanId",
    level: "high",
    label: "Subscription Plan",
    requiresConfirmation: true,
    requiresReason: true,
  },
}

/**
 * Get sensitivity level for a field
 */
export function getFieldSensitivity(field: string): FieldSensitivity | null {
  return ORGANIZATION_FIELD_SENSITIVITY[field] || null
}

/**
 * Get all fields that require confirmation
 */
export function getFieldsRequiringConfirmation(): string[] {
  return Object.values(ORGANIZATION_FIELD_SENSITIVITY)
    .filter(f => f.requiresConfirmation)
    .map(f => f.field)
}

/**
 * Get all fields that require reason
 */
export function getFieldsRequiringReason(): string[] {
  return Object.values(ORGANIZATION_FIELD_SENSITIVITY)
    .filter(f => f.requiresReason)
    .map(f => f.field)
}

/**
 * Check if any changed fields require confirmation
 */
export function requiresConfirmation(changedFields: string[]): boolean {
  return changedFields.some(field => {
    const sensitivity = getFieldSensitivity(field)
    return sensitivity?.requiresConfirmation === true
  })
}

/**
 * Check if any changed fields require reason
 */
export function requiresReason(changedFields: string[]): boolean {
  return changedFields.some(field => {
    const sensitivity = getFieldSensitivity(field)
    return sensitivity?.requiresReason === true
  })
}

/**
 * Get the highest sensitivity level from a list of fields
 */
export function getHighestSensitivityLevel(fields: string[]): SensitivityLevel {
  let highest: SensitivityLevel = "low"
  
  for (const field of fields) {
    const sensitivity = getFieldSensitivity(field)
    if (!sensitivity) continue
    
    if (sensitivity.level === "high") {
      return "high"
    } else if (sensitivity.level === "medium" && highest === "low") {
      highest = "medium"
    }
  }
  
  return highest
}

