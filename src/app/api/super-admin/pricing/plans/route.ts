/**
 * SUPER ADMIN PRICING PLANS API ROUTE
 * 
 * CRUD operations for pricing plans
 * GET: List all pricing plans
 * POST: Create new pricing plan
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { logPricingPlanAction, logPricingPlanFeatureAction, logPricingPlanEntitlementAction } from "@/lib/audit/audit-helpers"
import { ACTION_TYPES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/audit-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const pricingPlans = await prisma.pricingPlan.findMany({
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" }
      ],
      include: {
        features: true,
        entitlements: true,
        subscriptionModels: {
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

    return NextResponse.json({ pricingPlans }, { status: 200 })
  } catch (error: any) {
    console.error("[Pricing Plans GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Pricing Plans" },
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
      name,
      slug,
      descriptionMarketing,
      isPublic,
      isActive,
      displayOrder,
      features,
      entitlements
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name und Slug sind erforderlich" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { slug }
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: "Ein Pricing Plan mit diesem Slug existiert bereits" },
        { status: 400 }
      )
    }

    // Create pricing plan
    const pricingPlan = await prisma.pricingPlan.create({
      data: {
        name,
        slug,
        descriptionMarketing: descriptionMarketing || null,
        isPublic: isPublic ?? true,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
        features: features ? {
          create: features.map((f: any) => ({
            featureKey: f.featureKey,
            included: f.included ?? true,
            note: f.note || null
          }))
        } : undefined,
        entitlements: entitlements ? {
          create: entitlements.map((e: any) => ({
            entitlementKey: e.entitlementKey,
            value: e.value === null || e.value === undefined ? null : parseInt(e.value)
          }))
        } : undefined
      },
      include: {
        features: true,
        entitlements: true,
        subscriptionModels: true
      }
    })

    // Audit log: Pricing Plan created
    const ipAddress = getClientIp(req)
    await logPricingPlanAction(ACTION_TYPES.CREATE, pricingPlan.id, {
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      newValue: {
        name,
        slug,
        descriptionMarketing,
        isPublic,
        isActive,
        displayOrder
      },
      source: "API",
      ipAddress,
      metadata: {
        featuresCount: pricingPlan.features.length,
        entitlementsCount: pricingPlan.entitlements.length
      }
    })

    // Audit log: Features assigned
    for (const feature of pricingPlan.features) {
      await logPricingPlanFeatureAction(ACTION_TYPES.CREATE, feature.id, {
        actorId: session.id,
        actorRole: "SUPER_ADMIN",
        pricingPlanId: pricingPlan.id,
        featureKey: feature.featureKey,
        newValue: {
          included: feature.included,
          note: feature.note
        },
        source: "API",
        ipAddress
      })
    }

    // Audit log: Entitlements assigned
    for (const entitlement of pricingPlan.entitlements) {
      await logPricingPlanEntitlementAction(ACTION_TYPES.CREATE, entitlement.id, {
        actorId: session.id,
        actorRole: "SUPER_ADMIN",
        pricingPlanId: pricingPlan.id,
        entitlementKey: entitlement.entitlementKey,
        newValue: {
          value: entitlement.value
        },
        source: "API",
        ipAddress
      })
    }

    return NextResponse.json({ pricingPlan }, { status: 201 })
  } catch (error: any) {
    console.error("[Pricing Plans POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen des Pricing Plans" },
      { status: 500 }
    )
  }
}

