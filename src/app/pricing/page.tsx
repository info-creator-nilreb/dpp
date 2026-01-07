/**
 * PUBLIC PRICING PAGE
 * 
 * Displays all public pricing plans with features, limits, and prices
 * Server Component with direct Prisma access
 */

import { prisma } from "@/lib/prisma"
import PricingPageContent from "./PricingPageContent"

export const dynamic = "force-dynamic"

export default async function PricingPage() {
  // Load all public, active pricing plans
  const pricingPlans = await prisma.pricingPlan.findMany({
    where: {
      isPublic: true,
      isActive: true
    },
    orderBy: [
      { displayOrder: "asc" },
      { name: "asc" }
    ],
    include: {
      features: {
        where: {
          included: true
        }
      },
      entitlements: true,
      subscriptionModels: {
        where: {
          isActive: true
        },
        include: {
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
        },
        orderBy: [
          { billingInterval: "asc" }
        ]
      }
    }
  })

  // Load feature registry for feature details
  const featureRegistry = await prisma.featureRegistry.findMany({
    where: {
      enabled: true
    },
    select: {
      key: true,
      name: true,
      description: true,
      category: true
    }
  })

  // Load entitlements for entitlement details
  const entitlements = await prisma.entitlement.findMany({
    select: {
      key: true,
      type: true,
      unit: true
    }
  })

  return (
    <PricingPageContent
      pricingPlans={pricingPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        descriptionMarketing: plan.descriptionMarketing || null, // FIX: Explizit descriptionMarketing setzen
        isPublic: plan.isPublic,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        features: plan.features.map(f => ({
          id: f.id,
          pricingPlanId: f.pricingPlanId,
          featureKey: f.featureKey,
          included: f.included,
          note: f.note
        })),
        entitlements: plan.entitlements.map(e => ({
          id: e.id,
          pricingPlanId: e.pricingPlanId,
          entitlementKey: e.entitlementKey,
          value: e.value
        })),
        subscriptionModels: plan.subscriptionModels.map(model => ({
          id: model.id,
          pricingPlanId: model.pricingPlanId,
          billingInterval: model.billingInterval,
          minCommitmentMonths: model.minCommitmentMonths,
          trialDays: model.trialDays,
          isActive: model.isActive,
          stripePriceId: model.stripePriceId,
          createdAt: model.createdAt.toISOString(),
          updatedAt: model.updatedAt.toISOString(),
          prices: model.prices.map(price => ({
            id: price.id,
            subscriptionModelId: price.subscriptionModelId,
            amount: price.amount,
            currency: price.currency,
            validFrom: price.validFrom.toISOString(),
            validTo: price.validTo?.toISOString() || null,
            isActive: price.isActive,
            createdAt: price.createdAt.toISOString()
          }))
        }))
      }))}
      featureRegistry={featureRegistry}
      entitlements={entitlements}
    />
  )
}

