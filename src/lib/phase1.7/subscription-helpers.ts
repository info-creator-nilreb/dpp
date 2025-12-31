/**
 * Phase 1.7: Subscription Helper Functions
 * 
 * Helper functions for subscription state management
 */

import { prisma } from "@/lib/prisma"
import { getNormalizedStatus, isFreeTier, isTrial, isActive } from "./subscription-state"

/**
 * Get organization's effective tier
 * 
 * Returns the tier that should be used for feature/limit enforcement
 */
export async function getOrganizationEffectiveTier(organizationId: string): Promise<{
  tier: "free" | "trial" | "paid"
  planId: string | null
  planName: string | null
  subscriptionStatus: string | null
}> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: {
        include: {
          subscriptionModel: {
            include: {
              pricingPlan: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!organization?.subscription) {
    return {
      tier: "free",
      planId: null,
      planName: null,
      subscriptionStatus: null,
    }
  }

  const subscription = organization.subscription
  const normalizedStatus = getNormalizedStatus(subscription)

  if (normalizedStatus === "trial") {
    return {
      tier: "trial",
      planId: subscription.subscriptionModelId,
      planName: subscription.subscriptionModel?.pricingPlan?.name || null,
      subscriptionStatus: subscription.status,
    }
  }

  if (normalizedStatus === "active") {
    return {
      tier: "paid",
      planId: subscription.subscriptionModelId,
      planName: subscription.subscriptionModel?.pricingPlan?.name || null,
      subscriptionStatus: subscription.status,
    }
  }

  // expired, canceled, or other
  return {
    tier: "free",
    planId: null,
    planName: null,
    subscriptionStatus: subscription.status,
  }
}

/**
 * Check if organization has access to a feature
 * 
 * Phase 1.7: Feature access is determined by subscription state, not hard-coded tiers
 */
export async function hasFeatureAccess(
  organizationId: string,
  featureKey: string
): Promise<boolean> {
  const effectiveTier = await getOrganizationEffectiveTier(organizationId)

  // Free tier: no paid features
  if (effectiveTier.tier === "free") {
    return false
  }

  // Trial and paid: check plan features
  if (effectiveTier.planId) {
    const planFeature = await prisma.pricingPlanFeature.findFirst({
      where: {
        pricingPlan: {
          subscriptionModels: {
            some: {
              id: effectiveTier.planId,
            },
          },
        },
        featureKey,
        included: true,
      },
    })

    return !!planFeature
  }

  return false
}

/**
 * Get organization's entitlement limit
 * 
 * Phase 1.7: Limits are determined by subscription state, not hard-coded tiers
 */
export async function getEntitlementLimit(
  organizationId: string,
  entitlementKey: string
): Promise<number | null> {
  const effectiveTier = await getOrganizationEffectiveTier(organizationId)

  // Free tier: no entitlements (or very limited)
  if (effectiveTier.tier === "free") {
    return null // or return 0 for strict limits
  }

  // Trial and paid: check plan entitlements
  if (effectiveTier.planId) {
    const entitlement = await prisma.pricingPlanEntitlement.findFirst({
      where: {
        pricingPlan: {
          subscriptionModels: {
            some: {
              id: effectiveTier.planId,
            },
          },
        },
        entitlementKey,
      },
    })

    return entitlement?.value ?? null
  }

  return null
}

