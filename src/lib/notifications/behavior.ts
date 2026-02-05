/**
 * NOTIFICATION BELL & CLICK BEHAVIOR – UX rules and types
 *
 * Enterprise SaaS: predictable, boring behavior.
 * No real-time push, no toasts, no deletion (read-only / archive).
 */

import type { NotificationEventPayload } from "./event-types"

// ─── Data model (minimal fields for this behavior) ──────────────────────────

export interface NotificationForUI {
  id: string
  type: string
  referenceType: string | null
  referenceId: string | null
  message: string | null
  read: boolean
  readAt: string | null
  createdAt: string
  /** Primary deep link route (from payload or event default). */
  targetRoute: string | null
  targetEntityId: string | null
  targetTab: string | null
  organisationId: string | null
  actorRole: string | null
}

// ─── /app/notifications page behavior ──────────────────────────────────────

/**
 * Default sorting: newest first (createdAt desc).
 * Grouping: optional "Today" / "This week" / "Older" for clarity; list remains single ordered list.
 * Read vs unread: visual distinction only; unread first optional (we use newest first for simplicity).
 * Empty state: show neutral message, no auto-actions.
 */
export const NOTIFICATIONS_PAGE_BEHAVIOR = {
  defaultSort: "createdAt" as const,
  defaultOrder: "desc" as const,
  /** Group labels for optional grouping (Today / This week / Älter). */
  groupBy: "optional_time" as const,
  /** Visiting /app/notifications does NOT auto-mark as read: explicit user action only (enterprise, audit-friendly). */
  visitingPageMarksAsRead: false,
  emptyStateMessage: "Sie haben derzeit keine Benachrichtigungen.",
}

// ─── Single notification click behavior ─────────────────────────────────────

/**
 * Each notification has:
 * - primary target route (deep link)
 * - optional secondary context (tab, section, version)
 * - clicking marks it as read
 * - order: mark as read first (optimistic), then navigate (so state is consistent if user goes back)
 */
export const NOTIFICATION_CLICK_BEHAVIOR = {
  /** Clicking a notification marks it as read. */
  clickMarksAsRead: true,
  /**
   * Order: mark as read first, then navigate.
   * Rationale: avoids race where user navigates away before mark completes; sidebar count updates correctly.
   */
  order: "mark_then_navigate" as const,
}

export interface NotificationClickTarget {
  primaryRoute: string
  tab?: string | null
  version?: string | number | null
  entityId?: string | null
}

/** Build full path for navigation (route + optional query for tab/version). */
export function buildNotificationClickPath(payload: NotificationClickTarget): string {
  const path = payload.primaryRoute
  const params = new URLSearchParams()
  if (payload.tab) params.set("tab", String(payload.tab))
  if (payload.version != null) params.set("version", String(payload.version))
  const qs = params.toString()
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path
}

// ─── Global actions ────────────────────────────────────────────────────────

/**
 * "Mark all as read": marks all notifications for the current user as read.
 * No confirmation; immediate. Sidebar count updates on next load or when pathname changes.
 */
export const MARK_ALL_AS_READ_BEHAVIOR = {
  requiresConfirmation: false,
  scope: "current_user" as const,
}

// ─── Rationale (comments) ───────────────────────────────────────────────────

// - visitingPageMarksAsRead: false → User explicitly chooses to "consume" items; no surprise read state.
// - mark_then_navigate → Ensures read state and badge stay in sync; no need for real-time push.
// - No deletion → Notifications are audit trail; archive/read-only only.
