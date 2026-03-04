/**
 * GET /api/app/organization/subscription
 *
 * Liefert Abonnement- und Plandaten inkl. State Machine Status und Berechtigungen.
 * Nur für Org-Admin/Owner (canEditBilling). Super-Admin erhält zusätzlich Stripe/featureOverrides.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"
import { getTrialDaysRemaining } from "@/lib/capabilities"
import { getSubscriptionState, SubscriptionStatus } from "@/lib/subscription-state-machine"

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
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    if (!(await canEditBilling(session.user.id, membership.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung für Abonnement & Plan" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: membership.organizationId },
      include: {
        subscription: {
          include: {
            subscriptionModel: {
              include: {
                pricingPlan: { select: { id: true, name: true, slug: true } },
              },
            },
            priceSnapshot: true,
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

    const sub = organization.subscription
    const planName = sub?.subscriptionModel?.pricingPlan?.name ?? (sub?.plan ? String(sub.plan) : null)
    const planSlug = sub?.subscriptionModel?.pricingPlan?.slug ?? null
    const interval = sub?.subscriptionModel?.billingInterval ?? null
    const trialDaysRemaining = sub ? getTrialDaysRemaining(sub as any) : null

    const subscriptionState = sub ? getSubscriptionState({
      status: sub.status,
      trialExpiresAt: sub.trialExpiresAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt,
    }) : null

    const canManage = await canEditBilling(session.user.id, membership.organizationId)
    const isSuperAdmin = (session?.user as { isPlatformAdmin?: boolean } | undefined)?.isPlatformAdmin === true

    const contractStartDate = sub?.currentPeriodStart ?? sub?.startedAt ?? null
    const cancellationNoticePeriodDays = sub?.cancellationNoticePeriodDays ?? 14
    let cancellationDeadline: Date | null = null
    if (sub?.currentPeriodEnd && cancellationNoticePeriodDays > 0) {
      const periodEnd = new Date(sub.currentPeriodEnd)
      periodEnd.setDate(periodEnd.getDate() - cancellationNoticePeriodDays)
      cancellationDeadline = periodEnd
    }

    return NextResponse.json({
      subscription: sub
        ? {
            id: sub.id,
            plan: planSlug || planName?.toLowerCase() || sub.plan,
            planName,
            status: sub.status,
            subscriptionState: subscriptionState as SubscriptionStatus | null,
            trialExpiresAt: sub.trialExpiresAt,
            trialStartedAt: sub.trialStartedAt,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            nextBillingDate: sub.nextBillingDate ?? sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            canceledAt: sub.canceledAt,
            billingInterval: interval,
            priceSnapshot: sub.priceSnapshot
              ? {
                  amount: sub.priceSnapshot.amount,
                  currency: sub.priceSnapshot.currency,
                  billingInterval: sub.priceSnapshot.billingInterval,
                }
              : null,
            contractStartDate,
            cancellationNoticePeriodDays,
            cancellationDeadline: cancellationDeadline?.toISOString() ?? null,
            ...(isSuperAdmin && {
              stripeCustomerId: sub.stripeCustomerId,
              stripeSubscriptionId: sub.stripeSubscriptionId,
              featureOverrides: sub.featureOverrides,
            }),
          }
        : null,
      permissions: {
        canChangePlan: canManage,
        canCancel: canManage,
        canEditPayment: canManage,
      },
      trialDaysRemaining,
      organization: {
        id: organization.id,
        name: organization.name,
        vatId: organization.vatId,
        billingEmail: organization.billingEmail,
        invoiceAddressStreet: organization.invoiceAddressStreet,
        invoiceAddressZip: organization.invoiceAddressZip,
        invoiceAddressCity: organization.invoiceAddressCity,
        invoiceAddressCountry: organization.invoiceAddressCountry,
      },
      paymentMethod: sub?.stripeCustomerId ? "Karte / SEPA" : null,
      isSuperAdmin,
    })
  } catch (e: unknown) {
    console.error("[ORGANIZATION_SUBSCRIPTION_GET]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler beim Laden" },
      { status: 500 }
    )
  }
}
