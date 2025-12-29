/**
 * SUPER ADMIN SUBSCRIPTION MODELS API ROUTE
 * 
 * CRUD operations for subscription models
 * GET: List all subscription models
 * POST: Create new subscription model
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { logSubscriptionModelAction } from "@/lib/audit/audit-helpers"
import { ACTION_TYPES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/audit-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const subscriptionModels = await prisma.subscriptionModel.findMany({
      include: {
        pricingPlan: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        prices: {
          orderBy: {
            validFrom: "desc"
          }
        }
      }
    })

    return NextResponse.json({ subscriptionModels }, { status: 200 })
  } catch (error: any) {
    console.error("[Subscription Models GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Subscription Models" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await req.json()
    const {
      pricingPlanId,
      billingInterval,
      minCommitmentMonths,
      trialDays,
      isActive,
      stripePriceId
    } = body

    // Validate required fields
    if (!pricingPlanId || !billingInterval) {
      return NextResponse.json(
        { error: "Pricing Plan ID und Billing Interval sind erforderlich" },
        { status: 400 }
      )
    }

    if (!["monthly", "yearly"].includes(billingInterval)) {
      return NextResponse.json(
        { error: "Billing Interval muss 'monthly' oder 'yearly' sein" },
        { status: 400 }
      )
    }

    // Check if pricing plan exists
    const pricingPlan = await prisma.pricingPlan.findUnique({
      where: { id: pricingPlanId }
    })

    if (!pricingPlan) {
      return NextResponse.json(
        { error: "Pricing Plan nicht gefunden" },
        { status: 404 }
      )
    }

    // Create subscription model
    const subscriptionModel = await prisma.subscriptionModel.create({
      data: {
        pricingPlanId,
        billingInterval,
        minCommitmentMonths: minCommitmentMonths || null,
        trialDays: trialDays ?? 0,
        isActive: isActive ?? true,
        stripePriceId: stripePriceId || null
      },
      include: {
        pricingPlan: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        prices: true
      }
    })

    // Audit log: Subscription Model created
    const ipAddress = getClientIp(req)
    await logSubscriptionModelAction(ACTION_TYPES.CREATE, subscriptionModel.id, {
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      pricingPlanId,
      newValue: {
        billingInterval,
        minCommitmentMonths,
        trialDays,
        isActive,
        stripePriceId
      },
      source: "API",
      ipAddress
    })

    return NextResponse.json({ subscriptionModel }, { status: 201 })
  } catch (error: any) {
    console.error("[Subscription Models POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen des Subscription Models" },
      { status: 500 }
    )
  }
}

