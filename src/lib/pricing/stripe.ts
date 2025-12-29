/**
 * STRIPE INTEGRATION POINTS
 * 
 * Integration points for Stripe subscription management
 * These functions prepare the data structures needed for Stripe integration
 */

import { prisma } from "@/lib/prisma"

/**
 * Create subscription snapshots when checkout is completed
 * This should be called after successful Stripe checkout
 */
export async function createSubscriptionSnapshots(
  organizationId: string,
  subscriptionModelId: string,
  priceSnapshotId: string
): Promise<void> {
  // Get subscription model with pricing plan
  const subscriptionModel = await prisma.subscriptionModel.findUnique({
    where: { id: subscriptionModelId },
    include: {
      pricingPlan: {
        include: {
          entitlements: true
        }
      }
    }
  })

  if (!subscriptionModel) {
    throw new Error("Subscription model not found")
  }

  // Create entitlement snapshots
  const entitlementSnapshots = subscriptionModel.pricingPlan.entitlements.map(entitlement => ({
    subscriptionId: "", // Will be set after subscription creation
    key: entitlement.entitlementKey,
    value: entitlement.value
  }))

  // Note: This function is called after subscription is created
  // The actual snapshot creation happens in the subscription creation flow
}

/**
 * Prepare subscription data for Stripe checkout
 */
export async function prepareStripeCheckout(
  subscriptionModelId: string
): Promise<{
  subscriptionModel: any
  price: any
  pricingPlan: any
  features: any[]
  entitlements: any[]
}> {
  const subscriptionModel = await prisma.subscriptionModel.findUnique({
    where: { id: subscriptionModelId },
    include: {
      pricingPlan: {
        include: {
          features: true,
          entitlements: true
        }
      },
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
    throw new Error("Subscription model not found")
  }

  if (!subscriptionModel.isActive) {
    throw new Error("Subscription model is not active")
  }

  const price = subscriptionModel.prices[0]
  if (!price) {
    throw new Error("No active price found for subscription model")
  }

  return {
    subscriptionModel: {
      id: subscriptionModel.id,
      billingInterval: subscriptionModel.billingInterval,
      trialDays: subscriptionModel.trialDays,
      minCommitmentMonths: subscriptionModel.minCommitmentMonths,
      stripePriceId: subscriptionModel.stripePriceId
    },
    price: {
      id: price.id,
      amount: price.amount,
      currency: price.currency
    },
    pricingPlan: {
      id: subscriptionModel.pricingPlan.id,
      name: subscriptionModel.pricingPlan.name,
      slug: subscriptionModel.pricingPlan.slug
    },
    features: subscriptionModel.pricingPlan.features.filter(f => f.included),
    entitlements: subscriptionModel.pricingPlan.entitlements
  }
}

/**
 * Create subscription from Stripe checkout session
 * This should be called from Stripe webhook handler
 */
export async function createSubscriptionFromStripe(
  organizationId: string,
  subscriptionModelId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  priceSnapshotData: {
    amount: number
    currency: string
    billingInterval: string
  },
  entitlementSnapshots: Array<{
    key: string
    value: number | null
  }>
): Promise<any> {
  // Create price snapshot
  const priceSnapshot = await prisma.priceSnapshot.create({
    data: {
      amount: priceSnapshotData.amount,
      currency: priceSnapshotData.currency,
      billingInterval: priceSnapshotData.billingInterval
    }
  })

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      organizationId,
      subscriptionModelId,
      priceSnapshotId: priceSnapshot.id,
      status: "active",
      stripeSubscriptionId,
      stripeCustomerId,
      startedAt: new Date()
    }
  })

  // Create entitlement snapshots
  await prisma.entitlementSnapshot.createMany({
    data: entitlementSnapshots.map(entitlement => ({
      subscriptionId: subscription.id,
      key: entitlement.key,
      value: entitlement.value
    }))
  })

  return subscription
}

/**
 * Update subscription status from Stripe webhook
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: "active" | "past_due" | "canceled" | "expired",
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date,
  cancelAtPeriodEnd?: boolean,
  canceledAt?: Date
): Promise<void> {
  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: {
      status,
      ...(currentPeriodStart && { currentPeriodStart }),
      ...(currentPeriodEnd && { currentPeriodEnd }),
      ...(cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd }),
      ...(canceledAt && { canceledAt })
    }
  })
}

/**
 * Get Stripe price ID for a subscription model
 */
export async function getStripePriceId(subscriptionModelId: string): Promise<string | null> {
  const subscriptionModel = await prisma.subscriptionModel.findUnique({
    where: { id: subscriptionModelId },
    select: {
      stripePriceId: true
    }
  })

  return subscriptionModel?.stripePriceId || null
}

