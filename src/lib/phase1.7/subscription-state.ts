/**
 * Phase 1.7: Subscription State Machine & Free Tier Logic
 * 
 * "Free" is a derived state, never stored.
 * Subscription defines the actual state.
 */

export type SubscriptionStatus = 
  | "trial"      // Trial is active
  | "active"     // Paid subscription is active
  | "expired"    // Trial or subscription expired
  | "canceled"   // Subscription was canceled

export interface SubscriptionState {
  status: SubscriptionStatus
  planId: string | null
  planName: string | null
  trialEndsAt: Date | null
}

/**
 * Determine if organization is on "Free" tier
 * 
 * Free is derived when:
 * - No subscription exists
 * - Subscription status is "expired"
 */
export function isFreeTier(subscription: {
  status: string
  subscriptionModelId?: string | null
} | null): boolean {
  if (!subscription) {
    return true
  }
  
  // Legacy status values
  if (subscription.status === "expired" || subscription.status === "past_due") {
    return true
  }
  
  // Phase 1.7: New status values
  if (subscription.status === "expired") {
    return true
  }
  
  // If no plan is assigned, it's free
  if (!subscription.subscriptionModelId) {
    return true
  }
  
  return false
}

/**
 * Get display tier name for organization (German)
 * 
 * Returns:
 * - "Kostenlos" if isFreeTier === true
 * - "Testphase (Plan Name)" if status === "trial" or "trial_active"
 * - "Plan Name" if status === "active"
 */
export function getDisplayTier(subscription: {
  status: string
  subscriptionModelId?: string | null
  subscriptionModel?: {
    pricingPlan?: {
      name: string
    } | null
  } | null
} | null, planName?: string | null): string {
  if (isFreeTier(subscription)) {
    return "Kostenlos"
  }
  
  if (!subscription) {
    return "Kostenlos"
  }
  
  // Get plan name from subscription or parameter
  const displayPlanName = planName || 
    subscription.subscriptionModel?.pricingPlan?.name || 
    "Unbekannter Plan"
  
  // Trial status: Display as "Testphase (Plan Name)"
  if (subscription.status === "trial_active" || subscription.status === "trial") {
    return `Testphase (${displayPlanName})`
  }
  
  // Active subscription
  if (subscription.status === "active") {
    return displayPlanName
  }
  
  // Fallback
  return "Kostenlos"
}

/**
 * Get subscription status (normalized)
 * 
 * Normalizes legacy status values to Phase 1.7 status values
 */
export function getNormalizedStatus(subscription: {
  status: string
} | null): SubscriptionStatus {
  if (!subscription) {
    return "expired" // No subscription = expired = free
  }
  
  const status = subscription.status.toLowerCase()
  
  // Legacy status values
  if (status === "trial_active") {
    return "trial"
  }
  
  if (status === "past_due") {
    return "expired"
  }
  
  // Phase 1.7 status values
  if (status === "trial") {
    return "trial"
  }
  
  if (status === "active") {
    return "active"
  }
  
  if (status === "expired") {
    return "expired"
  }
  
  if (status === "canceled") {
    return "canceled"
  }
  
  // Default to expired (free)
  return "expired"
}

/**
 * Check if subscription is in trial
 */
export function isTrial(subscription: {
  status: string
  trialExpiresAt?: Date | null
  trialEndsAt?: Date | null
} | null): boolean {
  if (!subscription) {
    return false
  }
  
  const status = subscription.status.toLowerCase()
  
  if (status === "trial" || status === "trial_active") {
    // Check if trial hasn't expired
    const trialEnd = subscription.trialExpiresAt || subscription.trialEndsAt
    if (trialEnd) {
      return new Date(trialEnd) > new Date()
    }
    return true
  }
  
  return false
}

/**
 * Check if subscription is active (paid)
 */
export function isActive(subscription: {
  status: string
} | null): boolean {
  if (!subscription) {
    return false
  }
  
  return subscription.status.toLowerCase() === "active"
}

