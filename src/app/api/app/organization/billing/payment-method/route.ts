export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"
import { getStripeServer, isStripeConfigured } from "@/lib/stripe-server"

/** GET: Aktive Zahlungsmethode (Kartentyp, letzte 4, Ablauf) – keine Stripe-IDs */
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

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: user.organizationId },
      select: {
        stripeCustomerId: true,
        defaultPaymentMethodId: true,
        status: true,
        cancelAtPeriodEnd: true,
      },
    })

    const subscriptionCanceled =
      subscription?.status === "canceled" ||
      subscription?.status === "expired" ||
      subscription?.cancelAtPeriodEnd === true

    if (!subscription?.stripeCustomerId || !subscription?.defaultPaymentMethodId) {
      return NextResponse.json({
        paymentMethod: null,
        subscriptionCanceled,
        stripeConfigured: isStripeConfigured(),
      })
    }

    if (!isStripeConfigured()) {
      return NextResponse.json({
        paymentMethod: null,
        subscriptionCanceled,
        stripeConfigured: false,
      })
    }

    const stripe = getStripeServer()
    const pm = await stripe.paymentMethods.retrieve(subscription.defaultPaymentMethodId)

    if (pm.type !== "card" || !pm.card) {
      return NextResponse.json({
        paymentMethod: null,
        subscriptionCanceled,
        stripeConfigured: true,
      })
    }

    const card = pm.card
    const expDate = new Date(card.exp_year, card.exp_month - 1, 1)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const expiringSoon = daysUntilExpiry > 0 && daysUntilExpiry < 60

    const brand =
      card.brand === "visa"
        ? "Visa"
        : card.brand === "mastercard"
          ? "Mastercard"
          : card.brand === "amex"
            ? "American Express"
            : card.brand.charAt(0).toUpperCase() + card.brand.slice(1)

    return NextResponse.json({
      paymentMethod: {
        brand,
        last4: card.last4,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        expiringSoon,
      },
      subscriptionCanceled,
      stripeConfigured: true,
    })
  } catch (e: unknown) {
    console.error("[BILLING_PAYMENT_METHOD_GET]", e)
    const message = e instanceof Error ? e.message : "Fehler beim Laden der Zahlungsmethode"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/** POST: Neue Zahlungsmethode als Standard setzen (nach SetupIntent) */
export async function POST(req: Request) {
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

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Zahlungsmethode ist derzeit nicht konfigurierbar." },
        { status: 503 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const paymentMethodId = typeof body.paymentMethodId === "string" ? body.paymentMethodId.trim() : null
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "paymentMethodId ist erforderlich." },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: user.organizationId },
      select: { id: true, stripeCustomerId: true },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Kein Abonnement für diese Organisation gefunden." },
        { status: 400 }
      )
    }

    const stripe = getStripeServer()
    let customerId = subscription.stripeCustomerId

    if (!customerId) {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { name: true },
      })
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: org?.name ?? undefined,
        metadata: { organizationId: user.organizationId },
      })
      customerId = customer.id
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId: customerId },
      })
    }

    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } })
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { defaultPaymentMethodId: paymentMethodId },
    })

    return NextResponse.json({
      message: "Zahlungsmethode wurde gespeichert.",
    })
  } catch (e: unknown) {
    console.error("[BILLING_PAYMENT_METHOD_POST]", e)
    const msg = e instanceof Error ? e.message : "Fehler beim Speichern der Zahlungsmethode"
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}

/** DELETE: Zahlungsmethode entfernen (nur wenn erlaubt) */
export async function DELETE() {
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

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Zahlungsmethode ist derzeit nicht konfigurierbar." },
        { status: 503 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: user.organizationId },
      select: { stripeCustomerId: true, defaultPaymentMethodId: true },
    })

    if (!subscription?.stripeCustomerId || !subscription?.defaultPaymentMethodId) {
      return NextResponse.json({
        paymentMethod: null,
        message: "Keine Zahlungsmethode hinterlegt.",
      })
    }

    const stripe = getStripeServer()
    await stripe.paymentMethods.detach(subscription.defaultPaymentMethodId)
    await prisma.subscription.update({
      where: { organizationId: user.organizationId },
      data: { defaultPaymentMethodId: null },
    })

    return NextResponse.json({
      paymentMethod: null,
      message: "Zahlungsmethode wurde entfernt.",
    })
  } catch (e: unknown) {
    console.error("[BILLING_PAYMENT_METHOD_DELETE]", e)
    const message = e instanceof Error ? e.message : "Fehler beim Entfernen der Zahlungsmethode"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
