/**
 * GET /api/app/select-plan-context
 *
 * Kontext für die Select-Plan-Seite: hasUsedTrial, aktueller Plan, State.
 * Wird für kontextabhängige Buttons (Kostenlos testen / Jetzt aktivieren / Aktueller Plan) genutzt.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getSubscriptionState } from "@/lib/subscription-state-machine"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
      orderBy: { createdAt: "asc" },
    })

    if (!membership) {
      return NextResponse.json(
        { hasUsedTrial: false, subscription: null },
        { status: 200 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: membership.organizationId },
      select: {
        hasUsedTrial: true,
        trialEndedAt: true,
        subscription: {
          select: {
            status: true,
            trialExpiresAt: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true,
            subscriptionModel: {
              select: {
                pricingPlan: { select: { slug: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { hasUsedTrial: false, subscription: null },
        { status: 200 }
      )
    }

    const sub = organization.subscription
    const planSlug = sub?.subscriptionModel?.pricingPlan?.slug ?? null
    const planName = sub?.subscriptionModel?.pricingPlan?.name ?? null
    const subscriptionState = sub
      ? getSubscriptionState({
          status: sub.status,
          trialExpiresAt: sub.trialExpiresAt,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          canceledAt: sub.canceledAt,
        })
      : null

    return NextResponse.json({
      hasUsedTrial: organization.hasUsedTrial ?? false,
      trialEndedAt: organization.trialEndedAt?.toISOString() ?? null,
      subscription: sub
        ? {
            planSlug,
            planName,
            subscriptionState,
          }
        : null,
    })
  } catch (e: unknown) {
    console.error("[SELECT_PLAN_CONTEXT_GET]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler beim Laden" },
      { status: 500 }
    )
  }
}
