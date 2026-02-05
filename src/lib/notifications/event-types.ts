/**
 * NOTIFICATION EVENT TYPES – Single source of truth
 *
 * Strongly typed event types for the DPP SaaS notification system.
 * Used for creating notifications, resolving messages, and routing.
 */

// ─── Enums ─────────────────────────────────────────────────────────────────

export const NotificationPriority = {
  high: "high",
  medium: "medium",
  low: "low",
} as const
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority]

export const NotificationCategory = {
  collaboration_roles: "collaboration_roles",
  dpp_lifecycle: "dpp_lifecycle",
  compliance_audit: "compliance_audit",
  system_imports: "system_imports",
  business_limits: "business_limits",
} as const
export type NotificationCategory = (typeof NotificationCategory)[keyof typeof NotificationCategory]

/** Role of the actor who triggered the notification (for display and filtering). */
export const NotificationActorRole = {
  supplier: "supplier",
  editor: "editor",
  owner: "owner",
  admin: "admin",
  system: "system",
} as const
export type NotificationActorRole = (typeof NotificationActorRole)[keyof typeof NotificationActorRole]

// ─── Payload (deep linking) ─────────────────────────────────────────────────

export interface NotificationEventPayload {
  /** Primary target route (e.g. /app/dpps/123, /app/organization/users). */
  targetRoute: string
  /** Entity ID for deep link (DPP id, organisation id, invitation id, etc.). */
  targetEntityId?: string | null
  /** Optional: tab or section (e.g. "versions", "content"). */
  targetTab?: string | null
  /** Optional: version number or other context. */
  targetVersion?: string | number | null
  /** Organisation context (for scoping). */
  organisationId?: string | null
  /** Who triggered the event (supplier, editor, owner, system). */
  actorRole?: NotificationActorRole | null
  /** Optional override for the default message (UI-agnostic). */
  messageOverride?: string | null
}

// ─── Event type definition ─────────────────────────────────────────────────

export interface NotificationEventDefinition {
  key: string
  defaultMessageTemplate: string
  priority: NotificationPriority
  category: NotificationCategory
  /** Default route when no payload is provided (fallback). */
  defaultTargetRoute: string
}

// ─── Concrete event definitions (12+ minimum) ──────────────────────────────

export const NOTIFICATION_EVENT_KEYS = {
  // Collaboration & Roles
  organisation_invitation_received: "organisation_invitation_received",
  organisation_invitation_accepted: "organisation_invitation_accepted",
  role_changed: "role_changed",
  supplier_submitted_data: "supplier_submitted_data",
  data_confirmed_by_role: "data_confirmed_by_role",
  // DPP Lifecycle & Versioning
  dpp_created: "dpp_created",
  dpp_published: "dpp_published",
  new_dpp_version_available: "new_dpp_version_available",
  dpp_validation_failed: "dpp_validation_failed",
  // Compliance & Audit
  audit_relevant_change_detected: "audit_relevant_change_detected",
  // System & Imports
  import_finished_success: "import_finished_success",
  import_finished_error: "import_finished_error",
  // Business & Limits
  subscription_limit_reached: "subscription_limit_reached",
  // Legacy / Phase1 (keep for backward compatibility)
  join_request: "join_request",
  invitation_accepted: "invitation_accepted",
  subscription_warning: "subscription_warning",
  user_invited: "user_invited",
  user_removed: "user_removed",
  organization_updated: "organization_updated",
} as const

export type NotificationEventKey = (typeof NOTIFICATION_EVENT_KEYS)[keyof typeof NOTIFICATION_EVENT_KEYS]

/** Single source of truth: all event types with key, template, priority, category, default route. */
export const NOTIFICATION_EVENT_DEFINITIONS: Record<string, NotificationEventDefinition> = {
  [NOTIFICATION_EVENT_KEYS.organisation_invitation_received]: {
    key: NOTIFICATION_EVENT_KEYS.organisation_invitation_received,
    defaultMessageTemplate: "Sie wurden in eine Organisation eingeladen.",
    priority: NotificationPriority.high,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization/users",
  },
  [NOTIFICATION_EVENT_KEYS.organisation_invitation_accepted]: {
    key: NOTIFICATION_EVENT_KEYS.organisation_invitation_accepted,
    defaultMessageTemplate: "Eine Einladung wurde akzeptiert.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization/users",
  },
  [NOTIFICATION_EVENT_KEYS.role_changed]: {
    key: NOTIFICATION_EVENT_KEYS.role_changed,
    defaultMessageTemplate: "Ihre Rolle wurde geändert.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization",
  },
  [NOTIFICATION_EVENT_KEYS.supplier_submitted_data]: {
    key: NOTIFICATION_EVENT_KEYS.supplier_submitted_data,
    defaultMessageTemplate: "Ein Lieferant hat Daten eingereicht.",
    priority: NotificationPriority.high,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/dpps",
  },
  /** Legacy: Beitrags-Flow hat bisher "supplier_data_submitted" gespeichert → gleicher Text. */
  supplier_data_submitted: {
    key: "supplier_data_submitted",
    defaultMessageTemplate: "Ein Lieferant hat Daten eingereicht.",
    priority: NotificationPriority.high,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.data_confirmed_by_role]: {
    key: NOTIFICATION_EVENT_KEYS.data_confirmed_by_role,
    defaultMessageTemplate: "Daten wurden von einer Rolle bestätigt.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.dpp_created]: {
    key: NOTIFICATION_EVENT_KEYS.dpp_created,
    defaultMessageTemplate: "Ein neuer Produktpass wurde erstellt.",
    priority: NotificationPriority.low,
    category: NotificationCategory.dpp_lifecycle,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.dpp_published]: {
    key: NOTIFICATION_EVENT_KEYS.dpp_published,
    defaultMessageTemplate: "Ein Produktpass wurde veröffentlicht.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.dpp_lifecycle,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.new_dpp_version_available]: {
    key: NOTIFICATION_EVENT_KEYS.new_dpp_version_available,
    defaultMessageTemplate: "Eine neue Version des Produktpasses ist verfügbar.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.dpp_lifecycle,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.dpp_validation_failed]: {
    key: NOTIFICATION_EVENT_KEYS.dpp_validation_failed,
    defaultMessageTemplate: "Die Validierung des Produktpasses ist fehlgeschlagen.",
    priority: NotificationPriority.high,
    category: NotificationCategory.dpp_lifecycle,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.audit_relevant_change_detected]: {
    key: NOTIFICATION_EVENT_KEYS.audit_relevant_change_detected,
    defaultMessageTemplate: "Eine prüfungsrelevante Änderung wurde erfasst.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.compliance_audit,
    defaultTargetRoute: "/app/audit-logs",
  },
  [NOTIFICATION_EVENT_KEYS.import_finished_success]: {
    key: NOTIFICATION_EVENT_KEYS.import_finished_success,
    defaultMessageTemplate: "Import erfolgreich abgeschlossen.",
    priority: NotificationPriority.low,
    category: NotificationCategory.system_imports,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.import_finished_error]: {
    key: NOTIFICATION_EVENT_KEYS.import_finished_error,
    defaultMessageTemplate: "Import ist mit Fehlern beendet.",
    priority: NotificationPriority.high,
    category: NotificationCategory.system_imports,
    defaultTargetRoute: "/app/dpps",
  },
  [NOTIFICATION_EVENT_KEYS.subscription_limit_reached]: {
    key: NOTIFICATION_EVENT_KEYS.subscription_limit_reached,
    defaultMessageTemplate: "Ein Abonnement-Limit wurde erreicht.",
    priority: NotificationPriority.high,
    category: NotificationCategory.business_limits,
    defaultTargetRoute: "/app/organization/billing",
  },
  [NOTIFICATION_EVENT_KEYS.join_request]: {
    key: NOTIFICATION_EVENT_KEYS.join_request,
    defaultMessageTemplate: "Eine neue Beitrittsanfrage wurde gestellt.",
    priority: NotificationPriority.high,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization/users",
  },
  [NOTIFICATION_EVENT_KEYS.invitation_accepted]: {
    key: NOTIFICATION_EVENT_KEYS.invitation_accepted,
    defaultMessageTemplate: "Eine Einladung wurde akzeptiert.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization/users",
  },
  [NOTIFICATION_EVENT_KEYS.subscription_warning]: {
    key: NOTIFICATION_EVENT_KEYS.subscription_warning,
    defaultMessageTemplate: "Ihr Abonnement läuft bald ab.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.business_limits,
    defaultTargetRoute: "/app/organization/billing",
  },
  [NOTIFICATION_EVENT_KEYS.user_invited]: {
    key: NOTIFICATION_EVENT_KEYS.user_invited,
    defaultMessageTemplate: "Ein Benutzer wurde eingeladen.",
    priority: NotificationPriority.low,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization/users",
  },
  [NOTIFICATION_EVENT_KEYS.user_removed]: {
    key: NOTIFICATION_EVENT_KEYS.user_removed,
    defaultMessageTemplate: "Ein Benutzer wurde aus der Organisation entfernt.",
    priority: NotificationPriority.medium,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization/users",
  },
  [NOTIFICATION_EVENT_KEYS.organization_updated]: {
    key: NOTIFICATION_EVENT_KEYS.organization_updated,
    defaultMessageTemplate: "Die Organisation wurde aktualisiert.",
    priority: NotificationPriority.low,
    category: NotificationCategory.collaboration_roles,
    defaultTargetRoute: "/app/organization",
  },
}

/** Resolve message for a notification (payload override or default template). */
export function getNotificationMessage(
  type: string,
  messageOverride?: string | null
): string {
  if (messageOverride && messageOverride.trim()) {
    return messageOverride.trim()
  }
  const def = NOTIFICATION_EVENT_DEFINITIONS[type]
  return def?.defaultMessageTemplate ?? "Neue Benachrichtigung"
}

/** Resolve primary target route for a notification (payload or default). */
export function getNotificationTargetRoute(
  type: string,
  payload?: NotificationEventPayload | null
): string {
  if (payload?.targetRoute && payload.targetRoute.trim()) {
    return payload.targetRoute.trim()
  }
  const def = NOTIFICATION_EVENT_DEFINITIONS[type]
  return def?.defaultTargetRoute ?? "/app/dashboard"
}
