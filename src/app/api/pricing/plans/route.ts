/**
 * GET /api/pricing/plans
 * 
 * Returns public pricing plans for the select-plan page
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
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

    return NextResponse.json({
      plans: pricingPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.descriptionMarketing || null,
        subscriptionModels: plan.subscriptionModels.map(model => ({
          id: model.id,
          billingInterval: model.billingInterval,
          trialDays: model.trialDays,
          prices: model.prices.map(price => ({
            amount: price.amount,
            currency: price.currency
          }))
        }))
      }))
    })
  } catch (error: any) {
    console.error("[Pricing Plans API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Tarife" },
      { status: 500 }
    )
  }
}

