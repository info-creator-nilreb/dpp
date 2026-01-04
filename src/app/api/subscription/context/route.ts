/**
 * GET /api/subscription/context
 * 
 * Single source of truth for subscription context and access control.
 * Returns explicit subscription state and capabilities.
 * 
 * Response:
 * - state: 'loading' | 'none' | 'trial' | 'active'
 * - canAccessApp: boolean (true if trial or active)
 * - canPublish: boolean (true only if active and feature enabled)
 * - trialEndsAt: ISO string (only if state = 'trial')
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
        { 
          state: "none",
          canAccessApp: false,
          canPublish: false,
          trialEndsAt: null
        },
        { status: 200 } // Return 200 with state='none' instead of 401
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
                }
              }
            }
          }
        }
      }
    })

    if (!membership?.organization) {
      return NextResponse.json({
        state: "none",
        canAccessApp: false,
        canPublish: false,
        trialEndsAt: null
      })
    }

    const organization = membership.organization
    const subscription = organization.subscription

    // Determine explicit subscription state
    let state: "none" | "trial" | "active" = "none"
    let trialEndsAt: string | null = null
    let canAccessApp = false
    let canPublish = false

    if (!subscription) {
      // No subscription exists
      state = "none"
      canAccessApp = false
    } else {
      // Check if subscription has a Subscription Model with trial_days
      const hasTrialDays = subscription.subscriptionModel?.trialDays && subscription.subscriptionModel.trialDays > 0
      
      // Check if subscription is in trial status (either via trialStartedAt or status)
      const isTrialStatus = subscription.status === "trial_active" || subscription.status === "trial"
      
      if (isTrialStatus && hasTrialDays && subscription.subscriptionModel) {
        // Handle trial - use trialStartedAt if set, otherwise use createdAt or now
        let trialStartDate: Date
        if (subscription.trialStartedAt) {
          trialStartDate = new Date(subscription.trialStartedAt)
        } else {
          // Fallback: Use createdAt if available, otherwise use now
          // If trialStartedAt is null but status is trial_active, assume trial started now or at subscription creation
          trialStartDate = subscription.createdAt ? new Date(subscription.createdAt) : new Date()
          
          // Update subscription to set trialStartedAt (if not set)
          try {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { trialStartedAt: trialStartDate }
            })
          } catch (updateError) {
            // Ignore update errors (e.g. connection pool issues) - continue with calculated date
            console.warn("[Subscription Context] Could not update trialStartedAt:", updateError)
          }
        }
        
        // Calculate trial end date from trialStartDate + trialDays
        const subscriptionModel = subscription.subscriptionModel
        const trialEnd = new Date(trialStartDate)
        trialEnd.setDate(trialEnd.getDate() + (subscriptionModel.trialDays || 0))
        
        const now = new Date()
        if (trialEnd > now) {
          // Still in trial
          state = "trial"
          trialEndsAt = trialEnd.toISOString()
          canAccessApp = true // Trial users can access the app
        } else {
          // Trial expired - automatically expire subscription if still in trial status
          if (subscription.status === "trial_active" || subscription.status === "trial") {
            // Update subscription status to expired
            try {
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: "expired" }
              })
            } catch (updateError) {
              // Ignore update errors - continue with expired state
              console.warn("[Subscription Context] Could not update expired status:", updateError)
            }
            state = "none"
            canAccessApp = false
          } else if (subscription.status === "active") {
            state = "active"
            canAccessApp = true
          } else {
            state = "none"
            canAccessApp = false
          }
        }
      } else if (subscription.status === "active") {
        // Active subscription (not in trial)
        state = "active"
        canAccessApp = true
      } else {
        // Expired, canceled, or unknown status
        state = "none"
        canAccessApp = false
      }
    }

    // Check publishing capability - only for active subscriptions
    if (state === "active") {
      canPublish = await checkFeature("publish_dpp", { organizationId: organization.id })
    } else {
      // No publishing during trial or without subscription
      canPublish = false
    }

    return NextResponse.json({
      state,
      canAccessApp,
      canPublish,
      trialEndsAt
    })
  } catch (error: any) {
    console.error("[Subscription Context API] Error:", error)
    // On error, return 'none' state to be safe
    return NextResponse.json({
      state: "none",
      canAccessApp: false,
      canPublish: false,
      trialEndsAt: null
    })
  }
}

