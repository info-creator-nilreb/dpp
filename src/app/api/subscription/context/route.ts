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
      
      if (hasTrialDays && subscription.trialStartedAt) {
        // Calculate trial end date from trialStartedAt + trialDays
        const trialEnd = new Date(subscription.trialStartedAt)
        trialEnd.setDate(trialEnd.getDate() + (subscription.subscriptionModel.trialDays || 0))
        
        const now = new Date()
        if (trialEnd > now) {
          // Still in trial
          state = "trial"
          trialEndsAt = trialEnd.toISOString()
          canAccessApp = true // Trial users can access the app
        } else {
          // Trial expired - automatically expire subscription if still in trial status
          if (subscription.status === "trial_active") {
            // Update subscription status to expired
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: "expired" }
            })
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

