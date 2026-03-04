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

    if (state !== SubscriptionStatus.CANCEL_AT_PERIOD_END) {
      return NextResponse.json({ error: "Reaktivierung ist nur bei vorgemerkter Kündigung möglich" }, { status: 400 })
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: false },
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
    })
  } catch (e) {
    console.error("[ORGANIZATION_SUBSCRIPTION_REACTIVATE]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler bei der Reaktivierung" },
      { status: 500 },
    )
  }
}

