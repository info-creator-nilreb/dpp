export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"
import { getStripeServer, isStripeConfigured } from "@/lib/stripe-server"

/** POST: SetupIntent für neue Zahlungsmethode (Stripe Elements) */
export async function POST() {
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

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { organizationId: user.organizationId },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    })
  } catch (e: unknown) {
    console.error("[BILLING_SETUP_INTENT]", e)
    const message = e instanceof Error ? e.message : "Fehler beim Erstellen des Setup-Vorgangs"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
