/**
 * GET /api/app/subscription/status
 * 
 * Returns explicit subscription state and capabilities for the current user's organization.
 * This is the single source of truth for subscription status in the dashboard.
 * 
 * Returns:
 * - subscriptionState: "no_subscription" | "trial_subscription" | "active_subscription" | "expired_or_suspended"
 * - trialEndDate: ISO string (only if in trial)
 * - canPublish: boolean
 * - subscription: subscription details (if exists)
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkFeature } from "@/lib/capabilities/resolver"

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
                    pricingPlan: true
                  }
                },
                priceSnapshot: true
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

    // Determine explicit subscription state
    let subscriptionState: "no_subscription" | "trial_subscription" | "active_subscription" | "expired_or_suspended"
    let trialEndDate: string | null = null
    let canPublish = false

    if (!subscription) {
      // No subscription exists
      subscriptionState = "no_subscription"
    } else {
      // Check if subscription has a Subscription Model with trial_days
      const hasTrialDays = subscription.subscriptionModel?.trialDays && subscription.subscriptionModel.trialDays > 0
      
      if (hasTrialDays && subscription.trialStartedAt && subscription.subscriptionModel) {
        // Calculate trial end date from trialStartedAt + trialDays
        const subscriptionModel = subscription.subscriptionModel
        const trialEnd = new Date(subscription.trialStartedAt)
        trialEnd.setDate(trialEnd.getDate() + (subscriptionModel.trialDays || 0))
        
        const now = new Date()
        if (trialEnd > now) {
          // Still in trial
          subscriptionState = "trial_subscription"
          trialEndDate = trialEnd.toISOString()
        } else {
          // Trial expired - check if subscription is active
          if (subscription.status === "active") {
            subscriptionState = "active_subscription"
          } else {
            subscriptionState = "expired_or_suspended"
          }
        }
      } else if (subscription.status === "active") {
        // Active subscription (not in trial)
        subscriptionState = "active_subscription"
      } else if (subscription.status === "expired" || subscription.status === "canceled" || subscription.status === "past_due") {
        subscriptionState = "expired_or_suspended"
      } else {
        // Unknown status - treat as no subscription
        subscriptionState = "no_subscription"
      }
    }

    // Check publishing capability using the feature resolver
    if (subscriptionState === "active_subscription") {
      canPublish = await checkFeature("publish_dpp", { organizationId: organization.id })
    } else {
      // No publishing during trial or without subscription
      canPublish = false
    }

    return NextResponse.json({
      subscriptionState,
      trialEndDate,
      canPublish,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        pricingPlan: subscription.subscriptionModel?.pricingPlan ? {
          name: subscription.subscriptionModel.pricingPlan.name,
          slug: subscription.subscriptionModel.pricingPlan.slug
        } : undefined,
        subscriptionModel: subscription.subscriptionModel ? {
          billingInterval: subscription.subscriptionModel.billingInterval,
          trialDays: subscription.subscriptionModel.trialDays
        } : undefined,
        priceSnapshot: subscription.priceSnapshot ? {
          amount: subscription.priceSnapshot.amount,
          currency: subscription.priceSnapshot.currency
        } : undefined,
        trialStartedAt: subscription.trialStartedAt?.toISOString() || null,
        trialExpiresAt: subscription.trialExpiresAt?.toISOString() || null
      } : null
    })
  } catch (error: any) {
    console.error("[Subscription Status API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Abrufen des Subscription-Status" },
      { status: 500 }
    )
  }
}

