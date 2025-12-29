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

    // Build usage data
    const entitlements: Array<{
      key: string
      label: string
      limit: number | null
      current: number
      remaining: number | null
      unit?: string
    }> = []

    if (subscription) {
      // Get current usage for each entitlement
      for (const snapshot of subscription.entitlementSnapshots) {
        const definition = getEntitlementDefinition(snapshot.key)
        let current = 0

        // Get current usage based on entitlement key
        if (snapshot.key === "max_published_dpp") {
          current = await getPublishedDppCount(organization.id)
        }
        // Add more entitlement checks here as needed

        const remaining = snapshot.value !== null 
          ? Math.max(0, snapshot.value - current)
          : null

        entitlements.push({
          key: snapshot.key,
          label: definition.label,
          limit: snapshot.value,
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

