/**
 * FEATURE MANIFEST
 * 
 * Source of Truth for Product Features
 * 
 * This manifest defines all product-level features that are:
 * - Explicit product decisions
 * - Defined in code
 * - Tightly coupled to subscriptions and behavior
 * 
 * Features are classified as:
 * - core: Always enabled, fundamental to the product
 * - optional: Billable, tariff-based, can be enabled/disabled
 * - system: Compliance/infrastructure features, may be billable
 * 
 * IMPORTANT:
 * - Feature keys are IMMUTABLE once defined
 * - Features can only be added via code changes to this manifest
 * - Manual feature creation in the admin UI is NOT allowed
 * - System-defined features are synced automatically to the database
 */

export type FeatureKind = "core" | "optional" | "system"

export interface FeatureDefinition {
  /** Immutable capability key - must match code usage */
  key: string
  
  /** Feature classification */
  kind: FeatureKind
  
  /** Product category for organization */
  category: string
  
  /** Default display name (can be overridden in DB) */
  defaultName: string
  
  /** Default description (can be overridden in DB) */
  defaultDescription: string
  
  /** Core features are always enabled */
  isCore: boolean
  
  /** Billable features can be assigned to pricing plans */
  isBillable: boolean
  
  /** System features are infrastructure/compliance related */
  systemFeature: boolean
  
  /** Minimum plan required (for optional/system features) */
  minimumPlan?: "basic" | "pro" | "premium"
  
  /** Requires active subscription */
  requiresActiveSubscription?: boolean
  
  /** Requires publishing capability */
  requiresPublishingCapability?: boolean
  
  /** Visible in trial */
  visibleInTrial?: boolean
  
  /** Usable in trial */
  usableInTrial?: boolean
}

/**
 * FEATURE MANIFEST
 * 
 * All product features defined here
 */
export const FEATURE_MANIFEST: Record<string, FeatureDefinition> = {
  // ============================================
  // CORE FEATURES (Always Enabled)
  // ============================================
  cms_access: {
    key: "cms_access",
    kind: "core",
    category: "core",
    defaultName: "CMS Zugriff",
    defaultDescription: "Grundlegender Zugriff auf das Content Management System",
    isCore: true,
    isBillable: false,
    systemFeature: false,
    requiresActiveSubscription: false,
    visibleInTrial: true,
    usableInTrial: true,
  },

  // ============================================
  // OPTIONAL FEATURES (Billable)
  // ============================================
  csv_import: {
    key: "csv_import",
    kind: "optional",
    category: "content",
    defaultName: "CSV Import",
    defaultDescription: "Import von Produktdaten via CSV-Dateien",
    isCore: false,
    isBillable: true,
    systemFeature: false,
    minimumPlan: "basic",
    requiresActiveSubscription: true,
    visibleInTrial: true,
    usableInTrial: false,
  },

  ai_analysis: {
    key: "ai_analysis",
    kind: "optional",
    category: "content",
    defaultName: "KI-Analyse",
    defaultDescription: "Automatische Analyse und Vorschläge für Produktdaten",
    isCore: false,
    isBillable: true,
    systemFeature: false,
    minimumPlan: "pro",
    requiresActiveSubscription: true,
    visibleInTrial: true,
    usableInTrial: false,
  },

  publish_dpp: {
    key: "publish_dpp",
    kind: "optional",
    category: "publishing",
    defaultName: "DPP Veröffentlichung",
    defaultDescription: "Digitale Produktpässe veröffentlichen und öffentlich zugänglich machen",
    isCore: false,
    isBillable: true,
    systemFeature: false,
    minimumPlan: "basic",
    requiresActiveSubscription: true,
    requiresPublishingCapability: true,
    visibleInTrial: true,
    usableInTrial: false,
  },

  // ============================================
  // SYSTEM FEATURES (Compliance/Infrastructure)
  // ============================================
  audit_logs: {
    key: "audit_logs",
    kind: "system",
    category: "system",
    defaultName: "Audit Logs",
    defaultDescription: "Unveränderliche Historie aller Compliance-relevanten Aktionen",
    isCore: false,
    isBillable: true,
    systemFeature: true,
    minimumPlan: "basic",
    requiresActiveSubscription: true,
    visibleInTrial: true,
    usableInTrial: true,
  },

  advanced_styling: {
    key: "advanced_styling",
    kind: "optional",
    category: "styling",
    defaultName: "Erweiterte Gestaltung",
    defaultDescription: "Erweiterte Styling-Optionen für DPPs",
    isCore: false,
    isBillable: true,
    systemFeature: false,
    minimumPlan: "pro",
    requiresActiveSubscription: true,
    visibleInTrial: true,
    usableInTrial: false,
  },

  custom_domains: {
    key: "custom_domains",
    kind: "optional",
    category: "publishing",
    defaultName: "Eigene Domains",
    defaultDescription: "Veröffentlichung von DPPs unter eigenen Domains",
    isCore: false,
    isBillable: true,
    systemFeature: false,
    minimumPlan: "premium",
    requiresActiveSubscription: true,
    visibleInTrial: false,
    usableInTrial: false,
  },
}

/**
 * Get all feature definitions
 */
export function getAllFeatureDefinitions(): FeatureDefinition[] {
  return Object.values(FEATURE_MANIFEST)
}

/**
 * Get feature definition by key
 */
export function getFeatureDefinition(key: string): FeatureDefinition | null {
  return FEATURE_MANIFEST[key] || null
}

/**
 * Get core features only
 */
export function getCoreFeatures(): FeatureDefinition[] {
  return getAllFeatureDefinitions().filter(f => f.isCore)
}

/**
 * Get billable features only
 */
export function getBillableFeatures(): FeatureDefinition[] {
  return getAllFeatureDefinitions().filter(f => f.isBillable)
}

/**
 * Get system features only
 */
export function getSystemFeatures(): FeatureDefinition[] {
  return getAllFeatureDefinitions().filter(f => f.systemFeature)
}

/**
 * Validate feature key exists in manifest
 */
export function isValidFeatureKey(key: string): boolean {
  return key in FEATURE_MANIFEST
}

