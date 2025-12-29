/**
 * FEATURE ENFORCEMENT
 * 
 * Server-side enforcement of feature availability
 * Checks subscription against Feature Registry
 */

import { prisma } from "@/lib/prisma"

/**
 * Check if a feature is available for an organization
 * Considers Trial Feature Overrides if organization is in trial
 */
export async function hasFeature(
  organizationId: string,
  featureKey: string
): Promise<boolean> {
  const inTrial = await isInTrial(organizationId)

  // Get subscription with pricing plan and trial overrides
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      subscriptionModel: {
        include: {
          pricingPlan: {
            include: {
              features: {
                where: {
                  featureKey,
                  included: true
                }
              }
            }
          }
        }
      }
    }
  })

  // If in trial, check Trial Feature Override first
  if (inTrial && subscription && (subscription as any).subscriptionModel) {
    const subscriptionModel = (subscription as any).subscriptionModel
    const trialOverride = subscriptionModel.trialFeatureOverrides?.[0]
    if (trialOverride) {
      // Trial override exists - use it
      return trialOverride.enabled
    }
    // No trial override - fall through to pricing plan feature
  }

  // Check pricing plan feature
  if (subscription && (subscription as any).subscriptionModel?.pricingPlan?.features.length > 0) {
    return true
  }

  // No active subscription - check Feature Registry for default behavior
  if (!subscription || subscription.status !== "active") {
    const feature = await prisma.featureRegistry.findUnique({
      where: { key: featureKey }
    })

    if (!feature || !feature.enabled) {
      return false
    }

    // Check if feature is available in trial or free tier
    return feature.visibleInTrial || feature.minimumPlan === "free"
  }

  // Fallback: Check Feature Registry
  const feature = await prisma.featureRegistry.findUnique({
    where: { key: featureKey }
  })

  if (!feature || !feature.enabled) {
    return false
  }

  return true
}

/**
 * Get all available features for an organization
 */
export async function getAvailableFeatures(organizationId: string): Promise<string[]> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      subscriptionModel: {
        include: {
          pricingPlan: {
            include: {
              features: {
                where: {
                  included: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!subscription || subscription.status !== "active") {
    // Return free tier features
    const freeFeatures = await prisma.featureRegistry.findMany({
      where: {
        enabled: true,
        minimumPlan: "free",
        visibleInTrial: true
      },
      select: {
        key: true
      }
    })

    return freeFeatures.map(f => f.key)
  }

  // Return features from pricing plan
  return subscription.subscriptionModel?.pricingPlan?.features.map(f => f.featureKey) || []
}

/**
 * Check if organization has active subscription
 */
export async function hasActiveSubscription(organizationId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId }
  })

  return subscription?.status === "active" || subscription?.status === "trial_active"
}

/**
 * Check if organization is in trial
 * 
 * IMPORTANT: Only returns true if:
 * - A subscription exists
 * - The subscription has a Subscription Model with trialDays > 0
 * - The trial period hasn't expired (trialStartedAt + trialDays > now)
 * 
 * No implicit trial assignment - trials must be explicit via Subscription Model configuration.
 */
export async function isInTrial(organizationId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      subscriptionModel: true
    }
  })

  if (!subscription) {
    return false
  }

  // Trial is only valid if:
  // 1. Subscription has a Subscription Model
  // 2. Subscription Model has trialDays > 0
  // 3. Trial has started (trialStartedAt exists)
  // 4. Trial hasn't expired (trialStartedAt + trialDays > now)
  if (subscription.subscriptionModel && subscription.subscriptionModel.trialDays && subscription.subscriptionModel.trialDays > 0) {
    if (subscription.trialStartedAt) {
      const trialEndDate = new Date(subscription.trialStartedAt)
      trialEndDate.setDate(trialEndDate.getDate() + subscription.subscriptionModel.trialDays)
      const now = new Date()
      if (trialEndDate > now) {
        return true
      }
    }
  }

  return false
}

