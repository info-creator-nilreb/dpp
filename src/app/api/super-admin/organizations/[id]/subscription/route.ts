/**
 * SUPER ADMIN ORGANIZATION SUBSCRIPTION API
 * 
 * Change subscription status and plan for an organization
 * Phase 1.8: Requires confirmation and reason
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { prisma } from "@/lib/prisma"
import { logSuperAdminOrganizationUpdate } from "@/lib/phase1.5/super-admin-audit"
import { validateSubscriptionState } from "@/lib/phase1.9/subscription-cleanup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// PUT: Update subscription
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params
    const body = await request.json()
    const { 
      status,
      subscriptionModelId,
      reason,
      _confirmed,
    } = body

    // Phase 1.8: Backend Guard - Require confirmation
    if (!_confirmed) {
      return NextResponse.json(
        { error: "Bestätigung erforderlich. Diese Änderung muss über die UI bestätigt werden." },
        { status: 400 }
      )
    }

    // Phase 1.8: Require reason for subscription changes
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Ein Grund ist für Subscription-Änderungen erforderlich (mindestens 10 Zeichen)" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["trial", "active", "expired", "canceled", "trial_active", "past_due"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Ungültiger Subscription-Status" },
        { status: 400 }
      )
    }

    // Phase 1.9: Validate subscription state (trial requires planId)
    const stateValidation = validateSubscriptionState(status || "expired", subscriptionModelId || null)
    if (!stateValidation.valid) {
      return NextResponse.json(
        { error: stateValidation.error },
        { status: 400 }
      )
    }

    // Get current subscription state
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            subscriptionModel: {
              include: {
                pricingPlan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    const currentSubscription = organization.subscription
    const before = currentSubscription ? {
      status: currentSubscription.status,
      subscriptionModelId: currentSubscription.subscriptionModelId,
      planName: currentSubscription.subscriptionModel?.pricingPlan?.name || null,
    } : null

    // Update or create subscription
    let updatedSubscription
    if (currentSubscription) {
      // Update existing subscription
      updatedSubscription = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          status: status || currentSubscription.status,
          subscriptionModelId: subscriptionModelId || currentSubscription.subscriptionModelId,
          // Update trial dates if status changes to trial
          ...(status === "trial" || status === "trial_active" ? {
            trialStartedAt: currentSubscription.trialStartedAt || new Date(),
            trialExpiresAt: currentSubscription.trialExpiresAt || (() => {
              const expires = new Date()
              expires.setDate(expires.getDate() + 30) // Default 30 days
              return expires
            })(),
          } : {}),
        },
        include: {
          subscriptionModel: {
            include: {
              pricingPlan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })
    } else {
      // Create new subscription
      if (!subscriptionModelId) {
        return NextResponse.json(
          { error: "subscriptionModelId ist erforderlich, um eine neue Subscription zu erstellen" },
          { status: 400 }
        )
      }

      updatedSubscription = await prisma.subscription.create({
        data: {
          organizationId: id,
          status: status || "trial",
          subscriptionModelId,
          trialStartedAt: (status === "trial" || status === "trial_active") ? new Date() : null,
          trialExpiresAt: (status === "trial" || status === "trial_active") ? (() => {
            const expires = new Date()
            expires.setDate(expires.getDate() + 30) // Default 30 days
            return expires
          })() : null,
        },
        include: {
          subscriptionModel: {
            include: {
              pricingPlan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })
    }

    const after = {
      status: updatedSubscription.status,
      subscriptionModelId: updatedSubscription.subscriptionModelId,
      planName: updatedSubscription.subscriptionModel?.pricingPlan?.name || null,
    }

    // Phase 1.8: Enhanced audit log for subscription changes
    await logSuperAdminOrganizationUpdate(
      session.id,
      id,
      ["subscription.status", "subscription.planId"],
      before || {},
      after,
      reason.trim(),
      getClientIp(request),
      getClientUserAgent(request)
    )

    // Return updated organization
    const updatedOrg = await prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            subscriptionModel: {
              include: {
                pricingPlan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            lastLoginAt: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            dpps: true
          }
        }
      }
    })

    return NextResponse.json({ organization: updatedOrg })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_SUBSCRIPTION] PUT error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Aktualisieren der Subscription" },
      { status: 500 }
    )
  }
}

