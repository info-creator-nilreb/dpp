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
        ...plan,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        subscriptionModels: plan.subscriptionModels.map(model => ({
          ...model,
          createdAt: model.createdAt.toISOString(),
          updatedAt: model.updatedAt.toISOString(),
          prices: model.prices.map(price => ({
            ...price,
            validFrom: price.validFrom.toISOString(),
            validTo: price.validTo?.toISOString() || null,
            createdAt: price.createdAt.toISOString()
          }))
        }))
      }))}
      featureRegistry={featureRegistry}
      entitlements={entitlements}
    />
  )
}

