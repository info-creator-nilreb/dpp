export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    if (!(await canEditBilling(session.user.id, user.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung für den Abrechnungsbereich" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        subscription: {
          include: {
            subscriptionModel: {
              include: {
                pricingPlan: { select: { name: true, slug: true } },
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

    let invoicesOpen: { totalAmount: number }[] = []
    let lastInvoice: {
      id: string
      invoiceNumber: string
      periodStart: Date
      periodEnd: Date
      totalAmount: number
      currency: string
      status: string
      createdAt: Date
    } | null = null

    try {
      const [open, last] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            organizationId: user.organizationId,
            status: "open",
          },
          select: { id: true, totalAmount: true, currency: true },
        }),
        prisma.invoice.findFirst({
          where: { organizationId: user.organizationId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            periodStart: true,
            periodEnd: true,
            totalAmount: true,
            currency: true,
            status: true,
            createdAt: true,
            lines: { select: { metadata: true } },
          },
        }),
      ])
      invoicesOpen = open
      lastInvoice = last
    } catch (invErr) {
      console.warn("[BILLING_OVERVIEW] Invoice-Abfrage fehlgeschlagen (evtl. 'npx prisma generate' und Migration ausführen):", invErr)
    }

    const subscription = organization.subscription
    const planName =
      subscription?.subscriptionModel?.pricingPlan?.name ??
      (subscription?.plan ? String(subscription.plan) : null)
    const interval =
      subscription?.subscriptionModel?.billingInterval ?? null

    const openAmount = invoicesOpen.reduce((sum, inv) => sum + inv.totalAmount, 0)

    return NextResponse.json({
      subscription: subscription
        ? {
            status: subscription.status,
            plan: planName,
            interval,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            nextBillingDate: subscription.nextBillingDate ?? subscription.currentPeriodEnd,
          }
        : null,
      paymentMethod: subscription?.stripeCustomerId
        ? "Karte / SEPA"
        : null,
      lastInvoice: lastInvoice
        ? {
            id: lastInvoice.id,
            invoiceNumber: lastInvoice.invoiceNumber,
            periodStart: lastInvoice.periodStart,
            periodEnd: lastInvoice.periodEnd,
            totalAmount: lastInvoice.totalAmount,
            currency: lastInvoice.currency,
            status: lastInvoice.status,
            createdAt: lastInvoice.createdAt,
            hasOverage:
              "lines" in lastInvoice &&
              Array.isArray(lastInvoice.lines) &&
              lastInvoice.lines.some(
                (l: { metadata?: unknown }) =>
                  !!l.metadata &&
                  typeof l.metadata === "object" &&
                  "overage" in (l.metadata as object)
              ),
          }
        : null,
      openAmount,
      currency: "EUR",
      billing: {
        billingEmail: organization.billingEmail,
        billingContactUserId: organization.billingContactUserId,
        invoiceAddressStreet: organization.invoiceAddressStreet,
        invoiceAddressZip: organization.invoiceAddressZip,
        invoiceAddressCity: organization.invoiceAddressCity,
        invoiceAddressCountry: organization.invoiceAddressCountry,
        billingCountry: organization.billingCountry,
        vatId: organization.vatId ?? null,
      },
    })
  } catch (e: unknown) {
    console.error("[BILLING_OVERVIEW]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler beim Laden" },
      { status: 500 }
    )
  }
}
