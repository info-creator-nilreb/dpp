/**
 * SUPER ADMIN PRICING PLAN API ROUTE
 * 
 * CRUD operations for a single pricing plan
 * GET: Get pricing plan by ID
 * PUT: Update pricing plan
 * DELETE: Delete pricing plan
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { logPricingPlanAction, logPricingPlanFeatureAction, logPricingPlanEntitlementAction } from "@/lib/audit/audit-helpers"
import { ACTION_TYPES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/audit-utils"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const pricingPlan = await prisma.pricingPlan.findUnique({
      where: { id: params.id },
      include: {
        features: true,
        entitlements: true,
        subscriptionModels: {
          include: {
            prices: {
              orderBy: {
                validFrom: "desc"
              }
            }
          }
        }
      }
    })

    if (!pricingPlan) {
      return NextResponse.json(
        { error: "Pricing Plan nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json({ pricingPlan }, { status: 200 })
  } catch (error: any) {
    console.error("[Pricing Plan GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden des Pricing Plans" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if plan exists
    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { id: params.id }
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Pricing Plan nicht gefunden" },
        { status: 404 }
      )
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existingPlan.slug) {
      const slugConflict = await prisma.pricingPlan.findUnique({
        where: { slug }
      })

      if (slugConflict) {
        return NextResponse.json(
          { error: "Ein Pricing Plan mit diesem Slug existiert bereits" },
          { status: 400 }
        )
      }
    }

    // Get old values for audit log
    const oldValues: Record<string, any> = {}
    if (name !== undefined) oldValues.name = existingPlan.name
    if (slug !== undefined) oldValues.slug = existingPlan.slug
    if (descriptionMarketing !== undefined) oldValues.descriptionMarketing = existingPlan.descriptionMarketing
    if (isPublic !== undefined) oldValues.isPublic = existingPlan.isPublic
    if (isActive !== undefined) oldValues.isActive = existingPlan.isActive
    if (displayOrder !== undefined) oldValues.displayOrder = existingPlan.displayOrder

    // Get old features and entitlements for audit log
    const oldFeatures = await prisma.pricingPlanFeature.findMany({
      where: { pricingPlanId: params.id }
    })
    const oldEntitlements = await prisma.pricingPlanEntitlement.findMany({
      where: { pricingPlanId: params.id }
    })

    // Update pricing plan
    const pricingPlan = await prisma.pricingPlan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(descriptionMarketing !== undefined && { descriptionMarketing: descriptionMarketing || null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(features && {
          features: {
            deleteMany: {},
            create: features.map((f: any) => ({
              featureKey: f.featureKey,
              included: f.included ?? true,
              note: f.note || null
            }))
          }
        }),
        ...(entitlements && {
          entitlements: {
            deleteMany: {},
            create: entitlements.map((e: any) => ({
              entitlementKey: e.entitlementKey,
              value: e.value === null || e.value === undefined ? null : parseInt(e.value)
            }))
          }
        })
      },
      include: {
        features: true,
        entitlements: true,
        subscriptionModels: {
          include: {
            prices: {
              orderBy: {
                validFrom: "desc"
              }
            }
          }
        }
      }
    })

    // Audit log: Pricing Plan updated
    const ipAddress = getClientIp(req)
    const changedFields: string[] = []
    const newValues: Record<string, any> = {}
    
    if (name !== undefined && name !== existingPlan.name) {
      changedFields.push("name")
      newValues.name = name
    }
    if (slug !== undefined && slug !== existingPlan.slug) {
      changedFields.push("slug")
      newValues.slug = slug
    }
    if (descriptionMarketing !== undefined && descriptionMarketing !== existingPlan.descriptionMarketing) {
      changedFields.push("descriptionMarketing")
      newValues.descriptionMarketing = descriptionMarketing
    }
    if (isPublic !== undefined && isPublic !== existingPlan.isPublic) {
      changedFields.push("isPublic")
      newValues.isPublic = isPublic
    }
    if (isActive !== undefined && isActive !== existingPlan.isActive) {
      changedFields.push("isActive")
      newValues.isActive = isActive
    }
    if (displayOrder !== undefined && displayOrder !== existingPlan.displayOrder) {
      changedFields.push("displayOrder")
      newValues.displayOrder = displayOrder
    }

    // Log each changed field
    for (const field of changedFields) {
      await logPricingPlanAction(ACTION_TYPES.UPDATE, params.id, {
        actorId: session.id,
        actorRole: "SUPER_ADMIN",
        fieldName: field,
        oldValue: oldValues[field],
        newValue: newValues[field],
        source: "API",
        ipAddress
      })
    }

    // Audit log: Features changes
    if (features) {
      // Log deleted features
      for (const oldFeature of oldFeatures) {
        const stillExists = pricingPlan.features.some(f => f.id === oldFeature.id)
        if (!stillExists) {
          await logPricingPlanFeatureAction(ACTION_TYPES.DELETE, oldFeature.id, {
            actorId: session.id,
            actorRole: "SUPER_ADMIN",
            pricingPlanId: params.id,
            featureKey: oldFeature.featureKey,
            oldValue: {
              included: oldFeature.included,
              note: oldFeature.note
            },
            source: "API",
            ipAddress
          })
        }
      }

      // Log new/updated features
      for (const newFeature of pricingPlan.features) {
        const oldFeature = oldFeatures.find(f => f.featureKey === newFeature.featureKey)
        if (!oldFeature) {
          // New feature
          await logPricingPlanFeatureAction(ACTION_TYPES.CREATE, newFeature.id, {
            actorId: session.id,
            actorRole: "SUPER_ADMIN",
            pricingPlanId: params.id,
            featureKey: newFeature.featureKey,
            newValue: {
              included: newFeature.included,
              note: newFeature.note
            },
            source: "API",
            ipAddress
          })
        } else if (oldFeature.included !== newFeature.included || oldFeature.note !== newFeature.note) {
          // Updated feature
          await logPricingPlanFeatureAction(ACTION_TYPES.UPDATE, newFeature.id, {
            actorId: session.id,
            actorRole: "SUPER_ADMIN",
            pricingPlanId: params.id,
            featureKey: newFeature.featureKey,
            oldValue: {
              included: oldFeature.included,
              note: oldFeature.note
            },
            newValue: {
              included: newFeature.included,
              note: newFeature.note
            },
            source: "API",
            ipAddress
          })
        }
      }
    }

    // Audit log: Entitlements changes
    if (entitlements) {
      // Log deleted entitlements
      for (const oldEntitlement of oldEntitlements) {
        const stillExists = pricingPlan.entitlements.some(e => e.id === oldEntitlement.id)
        if (!stillExists) {
          await logPricingPlanEntitlementAction(ACTION_TYPES.DELETE, oldEntitlement.id, {
            actorId: session.id,
            actorRole: "SUPER_ADMIN",
            pricingPlanId: params.id,
            entitlementKey: oldEntitlement.entitlementKey,
            oldValue: {
              value: oldEntitlement.value
            },
            source: "API",
            ipAddress
          })
        }
      }

      // Log new/updated entitlements
      for (const newEntitlement of pricingPlan.entitlements) {
        const oldEntitlement = oldEntitlements.find(e => e.entitlementKey === newEntitlement.entitlementKey)
        if (!oldEntitlement) {
          // New entitlement
          await logPricingPlanEntitlementAction(ACTION_TYPES.CREATE, newEntitlement.id, {
            actorId: session.id,
            actorRole: "SUPER_ADMIN",
            pricingPlanId: params.id,
            entitlementKey: newEntitlement.entitlementKey,
            newValue: {
              value: newEntitlement.value
            },
            source: "API",
            ipAddress
          })
        } else if (oldEntitlement.value !== newEntitlement.value) {
          // Updated entitlement
          await logPricingPlanEntitlementAction(ACTION_TYPES.UPDATE, newEntitlement.id, {
            actorId: session.id,
            actorRole: "SUPER_ADMIN",
            pricingPlanId: params.id,
            entitlementKey: newEntitlement.entitlementKey,
            oldValue: {
              value: oldEntitlement.value
            },
            newValue: {
              value: newEntitlement.value
            },
            source: "API",
            ipAddress
          })
        }
      }
    }

    return NextResponse.json({ pricingPlan }, { status: 200 })
  } catch (error: any) {
    console.error("[Pricing Plan PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Aktualisieren des Pricing Plans" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    // Check if plan exists
    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { id: params.id },
      include: {
        subscriptionModels: {
          include: {
            subscriptions: true
          }
        }
      }
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Pricing Plan nicht gefunden" },
        { status: 404 }
      )
    }

    // Check if plan has active subscriptions
    const hasActiveSubscriptions = existingPlan.subscriptionModels.some(
      model => model.subscriptions && model.subscriptions.length > 0
    )

    if (hasActiveSubscriptions) {
      return NextResponse.json(
        { error: "Pricing Plan kann nicht gelöscht werden, da aktive Abonnements existieren" },
        { status: 400 }
      )
    }

    // Audit log: Pricing Plan deleted
    const ipAddress = getClientIp(req)
    await logPricingPlanAction(ACTION_TYPES.DELETE, params.id, {
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      oldValue: {
        name: existingPlan.name,
        slug: existingPlan.slug,
        descriptionMarketing: existingPlan.descriptionMarketing,
        isPublic: existingPlan.isPublic,
        isActive: existingPlan.isActive,
        displayOrder: existingPlan.displayOrder
      },
      source: "API",
      ipAddress,
      metadata: {
        subscriptionModelsCount: existingPlan.subscriptionModels.length
      }
    })

    // Delete pricing plan (cascade will handle related records)
    await prisma.pricingPlan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("[Pricing Plan DELETE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Löschen des Pricing Plans" },
      { status: 500 }
    )
  }
}

