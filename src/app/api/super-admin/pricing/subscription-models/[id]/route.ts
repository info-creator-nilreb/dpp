/**
 * SUPER ADMIN SUBSCRIPTION MODEL API ROUTE
 * 
 * CRUD operations for a single subscription model
 * GET: Get subscription model by ID
 * PUT: Update subscription model
 * DELETE: Delete subscription model
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { logSubscriptionModelAction } from "@/lib/audit/audit-helpers"
import { ACTION_TYPES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/audit-utils"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params
    const subscriptionModel = await prisma.subscriptionModel.findUnique({
      where: { id },
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

    if (!subscriptionModel) {
      return NextResponse.json(
        { error: "Subscription Model nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscriptionModel }, { status: 200 })
  } catch (error: any) {
    console.error("[Subscription Model GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden des Subscription Models" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params
    const body = await req.json()
    const {
      minCommitmentMonths,
      trialDays,
      isActive
    } = body

    // Check if model exists
    const existing = await prisma.subscriptionModel.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Subscription Model nicht gefunden" },
        { status: 404 }
      )
    }

    // Update subscription model
    const subscriptionModel = await prisma.subscriptionModel.update({
      where: { id },
      data: {
        ...(minCommitmentMonths !== undefined && { minCommitmentMonths: minCommitmentMonths || null }),
        ...(trialDays !== undefined && { trialDays }),
        ...(isActive !== undefined && { isActive })
      },
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

    // Audit log: Subscription Model updated
    const ipAddress = getClientIp(req)
    const changedFields: string[] = []
    
    if (minCommitmentMonths !== undefined && minCommitmentMonths !== existing.minCommitmentMonths) {
      changedFields.push("minCommitmentMonths")
      await logSubscriptionModelAction(ACTION_TYPES.UPDATE, id, {
        actorId: session.id,
        actorRole: "SUPER_ADMIN",
        pricingPlanId: existing.pricingPlanId,
        fieldName: "minCommitmentMonths",
        oldValue: existing.minCommitmentMonths,
        newValue: minCommitmentMonths,
        source: "API",
        ipAddress
      })
    }
    
    if (trialDays !== undefined && trialDays !== existing.trialDays) {
      changedFields.push("trialDays")
      await logSubscriptionModelAction(ACTION_TYPES.UPDATE, id, {
        actorId: session.id,
        actorRole: "SUPER_ADMIN",
        pricingPlanId: existing.pricingPlanId,
        fieldName: "trialDays",
        oldValue: existing.trialDays,
        newValue: trialDays,
        source: "API",
        ipAddress
      })
    }
    
    if (isActive !== undefined && isActive !== existing.isActive) {
      changedFields.push("isActive")
      await logSubscriptionModelAction(ACTION_TYPES.UPDATE, id, {
        actorId: session.id,
        actorRole: "SUPER_ADMIN",
        pricingPlanId: existing.pricingPlanId,
        fieldName: "isActive",
        oldValue: existing.isActive,
        newValue: isActive,
        source: "API",
        ipAddress
      })
    }

    return NextResponse.json({ subscriptionModel }, { status: 200 })
  } catch (error: any) {
    console.error("[Subscription Model PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Aktualisieren des Subscription Models" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params
    // Check if model exists and has subscriptions
    const existing = await prisma.subscriptionModel.findUnique({
      where: { id },
      include: {
        subscriptions: true
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Subscription Model nicht gefunden" },
        { status: 404 }
      )
    }

    if (existing.subscriptions && existing.subscriptions.length > 0) {
      return NextResponse.json(
        { error: "Subscription Model kann nicht gelöscht werden, da aktive Abonnements existieren" },
        { status: 400 }
      )
    }

    // Audit log: Subscription Model deleted
    const ipAddress = getClientIp(req)
    await logSubscriptionModelAction(ACTION_TYPES.DELETE, id, {
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      pricingPlanId: existing.pricingPlanId,
      oldValue: {
        billingInterval: existing.billingInterval,
        minCommitmentMonths: existing.minCommitmentMonths,
        trialDays: existing.trialDays,
        isActive: existing.isActive,
        stripePriceId: existing.stripePriceId
      },
      source: "API",
      ipAddress,
      metadata: {
        subscriptionsCount: existing.subscriptions?.length || 0
      }
    })

    // Delete subscription model (cascade will handle related records)
    await prisma.subscriptionModel.delete({
      where: { id }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("[Subscription Model DELETE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Löschen des Subscription Models" },
      { status: 500 }
    )
  }
}

