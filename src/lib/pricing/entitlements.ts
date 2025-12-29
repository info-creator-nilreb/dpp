/**
 * ENTITLEMENT ENFORCEMENT
 * 
 * Server-side enforcement of subscription limits
 * Uses immutable snapshots from subscriptions
 */

import { prisma } from "@/lib/prisma"

/**
 * Get current entitlement value for an organization
 * Considers Trial Entitlement Overrides if organization is in trial
 * Returns the value from the subscription snapshot (immutable) or trial override
 */
export async function getEntitlementValue(
  organizationId: string,
  entitlementKey: string
): Promise<number | null> {
  const { isInTrial } = await import("./features")
  const inTrial = await isInTrial(organizationId)

  // Get subscription with snapshots and trial overrides
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      entitlementSnapshots: {
        where: {
          key: entitlementKey
        }
      },
      subscriptionModel: {
        include: {
          trialEntitlementOverrides: {
            where: {
              entitlementKey
            }
          }
        }
      }
    }
  })

  // If in trial, check Trial Entitlement Override first
  if (inTrial && subscription && (subscription as any).subscriptionModel) {
    const subscriptionModel = (subscription as any).subscriptionModel
    const trialOverride = subscriptionModel.trialEntitlementOverrides?.[0]
    if (trialOverride !== undefined) {
      // Trial override exists - use it (can be null for unlimited)
      return trialOverride.value
    }
    // No trial override - fall through to snapshot
  }

  if (!subscription || subscription.status !== "active") {
    // No active subscription - return null (unlimited) or 0 based on your business logic
    // For now, we'll return null to allow free tier
    return null
  }

  const snapshot = subscription.entitlementSnapshots[0]
  return snapshot ? snapshot.value : null
}

/**
 * Check if organization has reached an entitlement limit
 */
export async function checkEntitlementLimit(
  organizationId: string,
  entitlementKey: string,
  currentUsage: number
): Promise<{ allowed: boolean; limit: number | null; remaining: number | null }> {
  const limit = await getEntitlementValue(organizationId, entitlementKey)

  if (limit === null) {
    // Unlimited
    return {
      allowed: true,
      limit: null,
      remaining: null
    }
  }

  const remaining = Math.max(0, limit - currentUsage)
  const allowed = currentUsage < limit

  return {
    allowed,
    limit,
    remaining
  }
}

/**
 * Get current published DPP count for an organization
 * Only counts DPPs with status = "PUBLISHED"
 * Draft and unpublished DPPs do NOT count toward the limit
 */
export async function getPublishedDppCount(organizationId: string): Promise<number> {
  return await prisma.dpp.count({
    where: {
      organizationId,
      status: "PUBLISHED"
    }
  })
}

/**
 * Get current DPP count for an organization (all statuses except DEPRECATED)
 * @deprecated Use getPublishedDppCount for limit checks
 */
export async function getDppCount(organizationId: string): Promise<number> {
  return await prisma.dpp.count({
    where: {
      organizationId,
      status: {
        not: "DEPRECATED"
      }
    }
  })
}

/**
 * Check if organization can publish a new DPP
 * Uses max_published_dpp entitlement and only counts PUBLISHED DPPs
 */
export async function canPublishDpp(organizationId: string): Promise<{
  allowed: boolean
  reason?: string
  limit?: number | null
  current?: number
  remaining?: number | null
}> {
  const currentCount = await getPublishedDppCount(organizationId)
  const check = await checkEntitlementLimit(organizationId, "max_published_dpp", currentCount)

  if (!check.allowed) {
    return {
      allowed: false,
      reason: `Limit für veröffentlichte DPPs erreicht. Maximum: ${check.limit}`,
      limit: check.limit,
      current: currentCount,
      remaining: check.remaining
    }
  }

  return {
    allowed: true,
    limit: check.limit,
    current: currentCount,
    remaining: check.remaining
  }
}

/**
 * Check if organization can create a new DPP
 * @deprecated Use canPublishDpp for limit checks
 */
export async function canCreateDpp(organizationId: string): Promise<{
  allowed: boolean
  reason?: string
  limit?: number | null
  current?: number
  remaining?: number | null
}> {
  const currentCount = await getDppCount(organizationId)
  const check = await checkEntitlementLimit(organizationId, "max_dpp", currentCount)

  if (!check.allowed) {
    return {
      allowed: false,
      reason: `DPP-Limit erreicht. Maximum: ${check.limit}`,
      limit: check.limit,
      current: currentCount,
      remaining: check.remaining
    }
  }

  return {
    allowed: true,
    limit: check.limit,
    current: currentCount,
    remaining: check.remaining
  }
}

/**
 * Get all entitlements for an organization
 */
export async function getOrganizationEntitlements(organizationId: string): Promise<Record<string, number | null>> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      entitlementSnapshots: true
    }
  })

  if (!subscription || subscription.status !== "active") {
    return {}
  }

  const entitlements: Record<string, number | null> = {}
  subscription.entitlementSnapshots.forEach(snapshot => {
    entitlements[snapshot.key] = snapshot.value
  })

  return entitlements
}

