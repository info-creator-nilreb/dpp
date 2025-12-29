/**
 * Audit Log Label Mappings
 * 
 * Übersetzt technische Enum-Werte in verständliche deutsche Bezeichnungen
 * für Nicht-Techniker, Auditoren und Compliance-Manager.
 * 
 * Backend-Enums bleiben unverändert, nur UI-Labels werden übersetzt.
 */

/**
 * Action Type Labels
 */
export const ACTION_TYPE_LABELS: Record<string, string> = {
  CREATE: "Erstellt",
  UPDATE: "Aktualisiert",
  DELETE: "Gelöscht",
  PUBLISH: "Veröffentlicht",
  ARCHIVE: "Archiviert",
  EXPORT: "Exportiert",
  ROLE_CHANGE: "Rolle geändert",
  USER_ADDED: "Benutzer hinzugefügt",
  USER_REMOVED: "Benutzer entfernt",
  PERMISSION_CHANGED: "Berechtigung geändert",
  AI_SUGGESTION_GENERATED: "KI-Vorschlag erstellt",
  AI_SUGGESTION_ACCEPTED: "KI-Vorschlag übernommen",
  AI_SUGGESTION_MODIFIED: "KI-Vorschlag angepasst",
  AI_SUGGESTION_REJECTED: "KI-Vorschlag verworfen",
  AI_AUTO_FILL_APPLIED: "KI-Auto-Ausfüllung angewendet",
  AI_ANALYSIS_RUN: "KI-Analyse ausgeführt",
  AI_CONFIDENCE_SCORE_UPDATED: "KI-Vertrauensbewertung aktualisiert",
}

/**
 * Entity Type Labels
 */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  DPP: "Digitaler Produktpass",
  DPP_VERSION: "Produktpass-Version",
  DPP_CONTENT: "Produktpass-Inhalt",
  DPP_MEDIA: "Medien (Produktpass)",
  USER: "Benutzer",
  ORGANIZATION: "Organisation",
  MEMBERSHIP: "Organisationszugehörigkeit",
  DPP_PERMISSION: "Zugriffsberechtigung",
  TEMPLATE: "Vorlage",
  PRICING_PLAN: "Preismodell",
  SUBSCRIPTION_MODEL: "Abonnement-Modell",
  PRICE: "Preis",
  ENTITLEMENT: "Berechtigung",
  PRICING_PLAN_FEATURE: "Funktion (Preismodell)",
  PRICING_PLAN_ENTITLEMENT: "Berechtigung (Preismodell)",
}

/**
 * Source Labels
 */
export const SOURCE_LABELS: Record<string, string> = {
  UI: "Benutzeroberfläche",
  API: "API",
  IMPORT: "Datenimport",
  AI: "KI-Assistent",
  SYSTEM: "System",
}

/**
 * Get human-readable action type label
 */
export function getActionLabel(actionType: string): string {
  return ACTION_TYPE_LABELS[actionType] || actionType
}

/**
 * Get human-readable entity type label
 */
export function getEntityLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] || entityType
}

/**
 * Get human-readable source label
 */
export function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source
}

/**
 * Get all action types for filter dropdown (with labels)
 */
export function getActionTypeOptions(): Array<{ value: string; label: string }> {
  return Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
}

/**
 * Get all entity types for filter dropdown (with labels)
 */
export function getEntityTypeOptions(): Array<{ value: string; label: string }> {
  return Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
}

/**
 * Get all sources for filter dropdown (with labels)
 */
export function getSourceOptions(): Array<{ value: string; label: string }> {
  return Object.entries(SOURCE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
}

