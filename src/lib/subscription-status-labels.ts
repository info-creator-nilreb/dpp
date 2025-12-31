/**
 * Subscription Status Labels
 * 
 * Provides user-friendly German labels for subscription statuses
 */

/**
 * Get German label for subscription status
 */
export function getSubscriptionStatusLabel(status: string): string {
  const normalizedStatus = status.toLowerCase()

  switch (normalizedStatus) {
    case "active":
      return "Aktiv"
    case "trial":
    case "trial_active":
      return "Testphase"
    case "expired":
      return "Abgelaufen"
    case "canceled":
      return "Gekündigt"
    case "past_due":
      return "Überfällig"
    default:
      return "Unbekannt"
  }
}

/**
 * Get German label for subscription state
 */
export function getSubscriptionStateLabel(state: string): string {
  switch (state) {
    case "no_subscription":
      return "Kein Abo"
    case "trial_subscription":
      return "Testphase"
    case "active_subscription":
      return "Aktiv"
    case "expired_or_suspended":
      return "Abgelaufen oder gesperrt"
    default:
      return "Unbekannt"
  }
}

/**
 * Replace "Trial" with German equivalent "Testphase"
 */
export function translateTrialToGerman(text: string): string {
  return text
    .replace(/Trial/gi, "Testphase")
    .replace(/trial/gi, "Testphase")
}

