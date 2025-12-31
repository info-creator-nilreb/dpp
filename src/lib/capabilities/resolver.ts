/**
 * CAPABILITY RESOLVER
 * 
 * Central resolver for feature capabilities
 * 
 * This is the single source of truth for feature availability.
 * All feature checks in code must go through this resolver.
 * 
 * Rules:
 * - Core features always return true
 * - Optional/system features respect admin configuration and subscription state
 * - Trial overrides are considered
 */

import { prisma } from "@/lib/prisma"
import { getFeatureDefinition, isValidFeatureKey } from "@/features/feature-manifest"
import { isInTrial } from "@/lib/pricing/features"

export interface CapabilityContext {
  organizationId: string
  userId?: string
}

/**
 * Check if a feature is available for the given context
 * 
 * This is the central capability resolver. All feature checks should use this.
 * 
 * @param featureKey - The feature key to check
 * @param context - Organization and user context
 * @returns true if feature is available, false otherwise
 */
export async function hasFeature(
  featureKey: string,
  context: CapabilityContext
): Promise<boolean> {
  // Validate feature key exists in manifest
  if (!isValidFeatureKey(featureKey)) {
    console.warn(`Invalid feature key: ${featureKey}`)
    return false
  }

  const featureDef = getFeatureDefinition(featureKey)
  if (!featureDef) {
    return false
  }

  // Core features are always enabled
  if (featureDef.isCore) {
    return true
  }

  // Check if feature is enabled in registry
  const feature = await prisma.featureRegistry.findUnique({
    where: { key: featureKey },
  })

  if (!feature || !feature.enabled) {
    return false
  }

  // Check trial overrides if in trial
  const inTrial = await isInTrial(context.organizationId)
  if (inTrial) {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: context.organizationId },
      include: {
        subscriptionModel: {
          include: {
            trialFeatureOverrides: {
              where: { featureKey },
            },
          },
        },
      },
    })

    if (subscription?.subscriptionModel?.trialFeatureOverrides && subscription.subscriptionModel.trialFeatureOverrides.length > 0) {
      const override = subscription.subscriptionModel.trialFeatureOverrides[0]
      return override.enabled
    }
  }

  // Check subscription and pricing plan
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: context.organizationId },
    include: {
      subscriptionModel: {
        include: {
          pricingPlan: {
            include: {
              features: {
                where: {
                  featureKey,
                  included: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // No active subscription
  if (!subscription || subscription.status !== "active") {
    // Check if feature is available in trial/free tier
    if (feature.visibleInTrial || feature.minimumPlan === "free") {
      return feature.usableInTrial ?? true
    }
    return false
  }

  // Check if feature is included in pricing plan
  const planFeature =
    subscription.subscriptionModel?.pricingPlan?.features.find(
      (f) => f.featureKey === featureKey && f.included
    )

  if (planFeature) {
    return true
  }

  // Feature not included in plan
  return false
}

/**
 * Get all available features for an organization
 */
export async function getAvailableFeatures(
  context: CapabilityContext
): Promise<string[]> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: context.organizationId },
    include: {
      subscriptionModel: {
        include: {
          pricingPlan: {
            include: {
              features: {
                where: { included: true },
              },
            },
          },
          trialFeatureOverrides: {
            where: { enabled: true },
          },
        },
      },
    },
  })

  const availableFeatures: string[] = []

  // Always include core features
  const coreFeatures = await prisma.featureRegistry.findMany({
    where: {
      enabled: true,
      category: "core",
    },
    select: { key: true },
  })
  availableFeatures.push(...coreFeatures.map((f) => f.key))

  // Normalize subscription status
  const normalizedStatus = subscription?.status?.toLowerCase() || "expired"
  const isActive = normalizedStatus === "active"
  const isTrial = normalizedStatus === "trial" || normalizedStatus === "trial_active"
  const hasSubscription = subscription && (isActive || isTrial)
  
  // Add features from pricing plan (for active subscriptions OR trial subscriptions)
  if (hasSubscription && subscription.subscriptionModel?.pricingPlan) {
    // Get pricing plan slug for feature registry lookup
    const planSlug = subscription.subscriptionModel.pricingPlan.slug?.toLowerCase() || null
    
    // Always add features from pricing plan first (these are the base features for the plan)
    const planFeatures =
      subscription.subscriptionModel.pricingPlan.features || []
    
    for (const planFeature of planFeatures) {
      if (planFeature.included && !availableFeatures.includes(planFeature.featureKey)) {
        availableFeatures.push(planFeature.featureKey)
      }
    }
    
    // ALWAYS check Feature Registry for features that match the plan's minimumPlan requirement
    // This ensures features are available even if not explicitly added to Pricing Plan
    if (planSlug && (planSlug === "premium" || planSlug === "pro" || planSlug === "basic")) {
      const planHierarchy: Record<string, string[]> = {
        "basic": ["basic"],
        "pro": ["basic", "pro"],
        "premium": ["basic", "pro", "premium"]
      }
      
      const allowedPlans = planHierarchy[planSlug] || []
      
      // Get features from Feature Registry that match the plan's minimumPlan requirement
      const registryFeatures = await prisma.featureRegistry.findMany({
        where: {
          enabled: true,
          minimumPlan: {
            in: allowedPlans
          },
          isCore: false, // Don't include core features (already added)
        },
        select: { key: true },
      })
      
      // Add registry features that aren't already included
      for (const registryFeature of registryFeatures) {
        if (!availableFeatures.includes(registryFeature.key)) {
          availableFeatures.push(registryFeature.key)
        }
      }
    }
    
    // If in trial, apply trial feature overrides (these can enable/disable features during trial)
    if (isTrial && subscription.subscriptionModel.trialFeatureOverrides) {
      const trialOverrides = subscription.subscriptionModel.trialFeatureOverrides
      for (const override of trialOverrides) {
        if (override.enabled) {
          // Enable feature if override says so
          if (!availableFeatures.includes(override.featureKey)) {
            availableFeatures.push(override.featureKey)
          }
        } else {
          // Disable feature if override says so (remove from available features)
          const index = availableFeatures.indexOf(override.featureKey)
          if (index > -1) {
            availableFeatures.splice(index, 1)
          }
        }
      }
    }
  } else {
    // No active subscription - include trial/free features
    const freeFeatures = await prisma.featureRegistry.findMany({
      where: {
        enabled: true,
        OR: [
          { visibleInTrial: true },
          { minimumPlan: "free" },
        ],
      },
      select: { key: true },
    })
    for (const freeFeature of freeFeatures) {
      if (!availableFeatures.includes(freeFeature.key)) {
        availableFeatures.push(freeFeature.key)
      }
    }
  }

  return availableFeatures
}

/**
 * Check if organization has active subscription
 */
export async function hasActiveSubscription(
  organizationId: string
): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  })

  return subscription?.status === "active" || subscription?.status === "trial_active"
}

/**
 * Alias for hasFeature - for backward compatibility
 * @deprecated Use hasFeature instead
 */
export const checkFeature = hasFeature

