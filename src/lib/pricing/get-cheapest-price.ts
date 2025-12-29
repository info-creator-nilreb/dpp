/**
 * Get Cheapest Price
 * 
 * Returns the cheapest monthly price from all active, public pricing plans.
 * If the cheapest price is yearly, it's converted to monthly (divided by 12).
 */

import { prisma } from "@/lib/prisma"

export interface CheapestPriceResult {
  amount: number // Always monthly amount (converted if yearly)
  currency: string
  planName: string
  originalBillingInterval: "monthly" | "yearly"
  originalAmount: number // Original amount before conversion
}

/**
 * Get the cheapest monthly price from all public, active pricing plans.
 * Yearly prices are converted to monthly (divided by 12).
 */
export async function getCheapestPrice(): Promise<CheapestPriceResult | null> {
  try {
    // Load all public, active pricing plans with their subscription models and prices
    const pricingPlans = await prisma.pricingPlan.findMany({
      where: {
        isPublic: true,
        isActive: true
      },
      include: {
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
          }
        }
      }
    })

    // Find the cheapest price across all plans (convert yearly to monthly)
    // Note: price.amount is stored in cents, so we need to convert to EUR first
    let cheapestPrice: CheapestPriceResult | null = null

    for (const plan of pricingPlans) {
      for (const model of plan.subscriptionModels) {
        if (model.prices.length > 0) {
          const price = model.prices[0]
          // Convert from cents to EUR
          const priceInEur = price.amount / 100
          
          // Convert yearly prices to monthly
          const monthlyAmountInEur = model.billingInterval === "yearly" 
            ? priceInEur / 12 
            : priceInEur
          
          if (!cheapestPrice || monthlyAmountInEur < cheapestPrice.amount) {
            cheapestPrice = {
              amount: monthlyAmountInEur,
              currency: price.currency,
              planName: plan.name,
              originalBillingInterval: model.billingInterval as "monthly" | "yearly",
              originalAmount: priceInEur
            }
          }
        }
      }
    }

    return cheapestPrice
  } catch (error) {
    console.error("[getCheapestPrice] Error:", error)
    return null
  }
}

