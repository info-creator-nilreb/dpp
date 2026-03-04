import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"
import { getSubscriptionState, SubscriptionStatus } from "@/lib/subscription-state-machine"

export async function POST() {
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
      return NextResponse.json({ error: "Keine Organisation zugeordnet" }, { status: 400 })
    }

    if (!(await canEditBilling(session.user.id, membership.organizationId))) {
      return NextResponse.json({ error: "Keine Berechtigung für Abonnement & Plan" }, { status: 403 })
    }

    const subscription = await prisma.subscription.findFirst({
      where: { organizationId: membership.organizationId },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Kein Abonnement vorhanden" }, { status: 404 })
    }

    const state = getSubscriptionState({
      status: subscription.status,
      trialExpiresAt: subscription.trialExpiresAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
    })

    if (state !== SubscriptionStatus.ACTIVE) {
      return NextResponse.json({ error: "Kündigung ist nur für aktive Abonnements möglich" }, { status: 400 })
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    })

    const newState = getSubscriptionState({
      status: updated.status,
      trialExpiresAt: updated.trialExpiresAt,
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      canceledAt: updated.canceledAt,
    })

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      subscriptionState: newState,
      accessUntil: updated.currentPeriodEnd ?? updated.nextBillingDate ?? null,
      noticePeriodDays: updated.cancellationNoticePeriodDays ?? 14,
    })
  } catch (e) {
    console.error("[ORGANIZATION_SUBSCRIPTION_CANCEL]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler bei der Kündigung" },
      { status: 500 },
    )
  }
}

