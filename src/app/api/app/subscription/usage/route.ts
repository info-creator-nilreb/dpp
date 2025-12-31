/**
 * GET /api/app/subscription/usage
 * 
 * Returns current subscription and usage data for the organization
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getPublishedDppCount } from "@/lib/pricing/entitlements"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { isInTrial } from "@/lib/pricing/features"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: {
        organization: {
          include: {
            subscription: {
              include: {
                subscriptionModel: {
                  include: {
                    pricingPlan: true,
                    trialEntitlementOverrides: true // Phase 1.9: Include trial overrides
                  }
                },
                priceSnapshot: true,
                entitlementSnapshots: true
              }
            }
          }
        }
      }
    })

    if (!membership?.organization) {
      return NextResponse.json(
        { error: "Keine Organisation gefunden" },
        { status: 404 }
      )
    }

    const organization = membership.organization
    const subscription = organization.subscription

    // Check if organization is in trial
    const inTrial = await isInTrial(organization.id)

    // Build usage data
    const entitlements: Array<{
      key: string
      label: string
      limit: number | null
      current: number
      remaining: number | null
      unit?: string
    }> = []

    if (subscription && subscription.subscriptionModel) {
      // Get all entitlement keys from snapshots (these are the entitlements for this plan)
      // If no snapshots exist (legacy subscriptions), try to get from pricing plan entitlements
      let entitlementKeys = subscription.entitlementSnapshots.map(s => s.key)
      
      // Legacy support: If no snapshots exist, try to get from pricing plan
      if (entitlementKeys.length === 0 && subscription.subscriptionModel.pricingPlan) {
        // This is a legacy subscription without snapshots - we need to create them or use defaults
        // For now, use common entitlement keys as fallback
        entitlementKeys = ["max_published_dpp"] // Default entitlement for legacy subscriptions
      }

      // For each entitlement, determine the limit based on trial status
      for (const key of entitlementKeys) {
        const definition = getEntitlementDefinition(key)
        let limit: number | null = null

        // If in trial, check for trial entitlement override first
        if (inTrial && subscription.subscriptionModel) {
          const trialOverride = subscription.subscriptionModel.trialEntitlementOverrides?.find(
            override => override.entitlementKey === key
          )
          if (trialOverride !== undefined) {
            // Trial override exists - use it (can be null for unlimited)
            limit = trialOverride.value
          } else {
            // No trial override - use snapshot value, or try pricing plan entitlement
            const snapshot = subscription.entitlementSnapshots.find(s => s.key === key)
            if (snapshot) {
              limit = snapshot.value
            } else {
              // Legacy subscription: Try to get from pricing plan entitlements
              // For now, use null (unlimited) as fallback for legacy subscriptions
              limit = null
            }
          }
        } else {
          // Not in trial - use snapshot value, or try pricing plan entitlement
          const snapshot = subscription.entitlementSnapshots.find(s => s.key === key)
          if (snapshot) {
            limit = snapshot.value
          } else {
            // Legacy subscription: Try to get from pricing plan entitlements
            // For now, use null (unlimited) as fallback for legacy subscriptions
            limit = null
          }
        }
        
        // Edge case: If limit is 0, treat as unlimited (null) to avoid "1 von 0" display issue
        if (limit === 0) {
          limit = null
        }

        let current = 0

        // Get current usage based on entitlement key
        if (key === "max_published_dpp") {
          current = await getPublishedDppCount(organization.id)
        }
        // Add more entitlement checks here as needed

        const remaining = limit !== null 
          ? Math.max(0, limit - current)
          : null

        entitlements.push({
          key,
          label: definition.label,
          limit,
          current,
          remaining,
          unit: definition.unit !== "count" ? definition.unit : undefined
        })
      }
    }

    return NextResponse.json({
      organizationId: organization.id,
      subscription: subscription ? {
        status: subscription.status,
        pricingPlan: subscription.subscriptionModel?.pricingPlan ? {
          name: subscription.subscriptionModel.pricingPlan.name,
          slug: subscription.subscriptionModel.pricingPlan.slug
        } : undefined,
        subscriptionModel: subscription.subscriptionModel ? {
          billingInterval: subscription.subscriptionModel.billingInterval
        } : undefined,
        priceSnapshot: subscription.priceSnapshot ? {
          amount: subscription.priceSnapshot.amount,
          currency: subscription.priceSnapshot.currency
        } : undefined
      } : undefined,
      entitlements
    })
  } catch (error: any) {
    console.error("Error fetching subscription usage:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

