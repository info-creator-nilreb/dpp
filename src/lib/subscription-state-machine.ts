/**
 * Subscription State Machine (Enterprise)
 *
 * Eindeutige Zustände für Vertragslogik und UI. Abgeleitet aus DB-Feldern.
 */

export enum SubscriptionStatus {
  TRIAL = "TRIAL",
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  CANCEL_AT_PERIOD_END = "CANCEL_AT_PERIOD_END",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED",
}

export type SubscriptionStatusType = `${SubscriptionStatus}`

interface SubscriptionInput {
  status: string
  trialExpiresAt?: Date | string | null
  currentPeriodStart?: Date | string | null
  currentPeriodEnd?: Date | string | null
  cancelAtPeriodEnd?: boolean
  canceledAt?: Date | string | null
}

/**
 * Leitet den State-Machine-Status aus der Subscription ab.
 * Reihenfolge der Prüfungen entscheidend.
 */
export function getSubscriptionState(sub: SubscriptionInput | null): SubscriptionStatus | null {
  if (!sub) return null

  const now = new Date()
  const status = (sub.status || "").toLowerCase()
  const trialEnd = sub.trialExpiresAt ? new Date(sub.trialExpiresAt) : null
  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null
  const canceledAt = sub.canceledAt ? new Date(sub.canceledAt) : null

  if (status === "past_due") return SubscriptionStatus.PAST_DUE

  if ((status === "trial_active" || status === "trial") && trialEnd) {
    if (trialEnd < now) return SubscriptionStatus.EXPIRED
    return SubscriptionStatus.TRIAL
  }

  if (sub.cancelAtPeriodEnd === true && periodEnd && periodEnd >= now) {
    return SubscriptionStatus.CANCEL_AT_PERIOD_END
  }

  if (status === "canceled" && canceledAt) return SubscriptionStatus.CANCELED

  if (status === "expired") return SubscriptionStatus.EXPIRED

  if ((status === "trial_active" || status === "trial") && trialEnd && trialEnd < now) {
    return SubscriptionStatus.EXPIRED
  }

  if (status === "active" && !sub.cancelAtPeriodEnd) return SubscriptionStatus.ACTIVE

  if (status === "active" && sub.cancelAtPeriodEnd) return SubscriptionStatus.CANCEL_AT_PERIOD_END

  if (periodEnd && periodEnd < now && (status === "canceled" || status === "expired")) {
    return SubscriptionStatus.EXPIRED
  }

  if (status === "canceled") return SubscriptionStatus.CANCELED

  return SubscriptionStatus.EXPIRED
}

/** Deutsche Bezeichnung für UI-Badge */
export function getSubscriptionStateLabel(state: SubscriptionStatus | null): string {
  if (!state) return "—"
  switch (state) {
    case SubscriptionStatus.TRIAL:
      return "Testphase"
    case SubscriptionStatus.ACTIVE:
      return "Aktiv"
    case SubscriptionStatus.PAST_DUE:
      return "Zahlung fehlgeschlagen"
    case SubscriptionStatus.CANCEL_AT_PERIOD_END:
      return "Kündigung vorgemerkt"
    case SubscriptionStatus.CANCELED:
      return "Beendet"
    case SubscriptionStatus.EXPIRED:
      return "Abgelaufen"
    default:
      return "—"
  }
}

/** Badge-Farblogik: TRIAL gelb, ACTIVE grün, PAST_DUE rot, CANCEL_AT_PERIOD_END orange, EXPIRED/CANCELED grau */
export function getSubscriptionStateBadgeStyle(state: SubscriptionStatus | null): {
  backgroundColor: string
  color: string
} {
  if (!state) return { backgroundColor: "#F3F4F6", color: "#6B7280" }
  switch (state) {
    case SubscriptionStatus.TRIAL:
      return { backgroundColor: "#FEF3C7", color: "#92400E" }
    case SubscriptionStatus.ACTIVE:
      return { backgroundColor: "#D1FAE5", color: "#065F46" }
    case SubscriptionStatus.PAST_DUE:
      return { backgroundColor: "#FEE2E2", color: "#991B1B" }
    case SubscriptionStatus.CANCEL_AT_PERIOD_END:
      return { backgroundColor: "#FFEDD5", color: "#C2410C" }
    case SubscriptionStatus.CANCELED:
      return { backgroundColor: "#E5E7EB", color: "#374151" }
    case SubscriptionStatus.EXPIRED:
      return { backgroundColor: "#F3F4F6", color: "#6B7280" }
    default:
      return { backgroundColor: "#F3F4F6", color: "#6B7280" }
  }
}

/** Zeigen wir den Planvergleich (Upgrade/Downgrade möglich)? Nicht bei EXPIRED, CANCELED, CANCEL_AT_PERIOD_END. */
export function showPlanComparison(state: SubscriptionStatus | null): boolean {
  if (!state) return true
  return (
    state !== SubscriptionStatus.CANCEL_AT_PERIOD_END &&
    state !== SubscriptionStatus.EXPIRED &&
    state !== SubscriptionStatus.CANCELED
  )
}

/** Brauchen wir einen kritischen Banner (PAST_DUE, EXPIRED)? */
export function isCriticalState(state: SubscriptionStatus | null): boolean {
  return state === SubscriptionStatus.PAST_DUE || state === SubscriptionStatus.EXPIRED
}
