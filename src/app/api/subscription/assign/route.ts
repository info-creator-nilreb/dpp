/**
 * POST /api/subscription/assign
 * 
 * Assigns a subscription model to the current user's organization.
 * Can be used for both trial and paid subscriptions.
 * 
 * Body:
 * - subscriptionModelId: string (required)
 * - startTrial: boolean (optional, defaults to false)
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { subscriptionModelId, startTrial = false } = body

    if (!subscriptionModelId || typeof subscriptionModelId !== "string") {
      return NextResponse.json(
        { error: "subscriptionModelId ist erforderlich" },
        { status: 400 }
      )
    }

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: {
        organization: {
          include: {
            subscription: true
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

    // Get subscription model
    const subscriptionModel = await prisma.subscriptionModel.findUnique({
      where: { id: subscriptionModelId },
      include: {
        pricingPlan: true,
        prices: {
          where: {
            isActive: true,
            OR: [
              { validTo: null },
              { validTo: { gt: new Date() } }
            ]
          },
          orderBy: {
            validFrom: "desc"
          },
          take: 1
        }
      }
    })

    if (!subscriptionModel) {
      return NextResponse.json(
        { error: "Subscription Model nicht gefunden" },
        { status: 404 }
      )
    }

    if (!subscriptionModel.isActive) {
      return NextResponse.json(
        { error: "Subscription Model ist nicht aktiv" },
        { status: 400 }
      )
    }

    // Get current price
    const currentPrice = subscriptionModel.prices[0]
    if (!currentPrice && !startTrial) {
      return NextResponse.json(
        { error: "Kein aktiver Preis für dieses Subscription Model gefunden" },
        { status: 400 }
      )
    }

    // Check if organization already has a subscription
    const existingSubscription = organization.subscription

    if (existingSubscription) {
      // Update existing subscription
      const now = new Date()
      let trialStartedAt: Date | null = null
      let trialExpiresAt: Date | null = null
      let status = "active"

      // If starting trial and subscription model has trial days
      if (startTrial && subscriptionModel.trialDays && subscriptionModel.trialDays > 0) {
        trialStartedAt = now
        trialExpiresAt = new Date(now)
        trialExpiresAt.setDate(trialExpiresAt.getDate() + subscriptionModel.trialDays)
        status = "trial_active"
      }

      // Update subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          subscriptionModelId: subscriptionModel.id,
          priceSnapshotId: currentPrice ? currentPrice.id : null,
          status,
          trialStartedAt,
          trialExpiresAt,
          startedAt: startTrial ? null : now, // Only set startedAt if not trial
          currentPeriodStart: startTrial ? null : now,
          currentPeriodEnd: startTrial ? null : (() => {
            const end = new Date(now)
            if (subscriptionModel.billingInterval === "monthly") {
              end.setMonth(end.getMonth() + 1)
            } else {
              end.setFullYear(end.getFullYear() + 1)
            }
            return end
          })(),
        },
        include: {
          subscriptionModel: {
            include: {
              pricingPlan: true
            }
          }
        }
      })

      // Create entitlement snapshots
      if (subscriptionModel.pricingPlan) {
        // Get pricing plan entitlements
        const planEntitlements = await prisma.pricingPlanEntitlement.findMany({
          where: { pricingPlanId: subscriptionModel.pricingPlan.id }
        })

        // Delete old snapshots
        await prisma.entitlementSnapshot.deleteMany({
          where: { subscriptionId: updatedSubscription.id }
        })

        // Create new snapshots
        for (const entitlement of planEntitlements) {
          await prisma.entitlementSnapshot.create({
            data: {
              subscriptionId: updatedSubscription.id,
              key: entitlement.entitlementKey,
              value: entitlement.value
            }
          })
        }
      }

      return NextResponse.json({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          trialStartedAt: updatedSubscription.trialStartedAt?.toISOString() || null,
          trialExpiresAt: updatedSubscription.trialExpiresAt?.toISOString() || null
        },
        message: startTrial ? "Trial erfolgreich gestartet" : "Subscription erfolgreich aktualisiert"
      })
    } else {
      // Create new subscription
      const now = new Date()
      let trialStartedAt: Date | null = null
      let trialExpiresAt: Date | null = null
      let status = "active"

      // If starting trial and subscription model has trial days
      if (startTrial && subscriptionModel.trialDays && subscriptionModel.trialDays > 0) {
        trialStartedAt = now
        trialExpiresAt = new Date(now)
        trialExpiresAt.setDate(trialExpiresAt.getDate() + subscriptionModel.trialDays)
        status = "trial_active"
      }

      // Create subscription
      const newSubscription = await prisma.subscription.create({
        data: {
          organizationId: organization.id,
          subscriptionModelId: subscriptionModel.id,
          priceSnapshotId: currentPrice ? currentPrice.id : null,
          status,
          trialStartedAt,
          trialExpiresAt,
          startedAt: startTrial ? null : now,
          currentPeriodStart: startTrial ? null : now,
          currentPeriodEnd: startTrial ? null : (() => {
            const end = new Date(now)
            if (subscriptionModel.billingInterval === "monthly") {
              end.setMonth(end.getMonth() + 1)
            } else {
              end.setFullYear(end.getFullYear() + 1)
            }
            return end
          })(),
        },
        include: {
          subscriptionModel: {
            include: {
              pricingPlan: true
            }
          }
        }
      })

      // Create entitlement snapshots
      if (subscriptionModel.pricingPlan) {
        const planEntitlements = await prisma.pricingPlanEntitlement.findMany({
          where: { pricingPlanId: subscriptionModel.pricingPlan.id }
        })

        for (const entitlement of planEntitlements) {
          await prisma.entitlementSnapshot.create({
            data: {
              subscriptionId: newSubscription.id,
              key: entitlement.entitlementKey,
              value: entitlement.value
            }
          })
        }
      }

      return NextResponse.json({
        success: true,
        subscription: {
          id: newSubscription.id,
          status: newSubscription.status,
          trialStartedAt: newSubscription.trialStartedAt?.toISOString() || null,
          trialExpiresAt: newSubscription.trialExpiresAt?.toISOString() || null
        },
        message: startTrial ? "Trial erfolgreich gestartet" : "Subscription erfolgreich erstellt"
      })
    }
  } catch (error: any) {
    console.error("[Subscription Assign API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Zuweisen der Subscription" },
      { status: 500 }
    )
  }
}

