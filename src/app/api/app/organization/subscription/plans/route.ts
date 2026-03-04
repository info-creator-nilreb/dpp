/**
 * GET /api/app/organization/subscription/plans
 *
 * Liefert öffentliche Tarife inkl. Entitlements für den Planvergleich
 * (Organisation → Abonnement & Plan). Zugriff nur mit canEditBilling.
 */

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

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
      orderBy: { createdAt: "asc" },
    })

    if (!membership || !(await canEditBilling(session.user.id, membership.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    const plans = await prisma.pricingPlan.findMany({
      where: { isPublic: true, isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        entitlements: true,
        subscriptionModels: {
          where: { isActive: true },
          include: {
            prices: {
              where: {
                isActive: true,
                OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
              },
              orderBy: { validFrom: "desc" },
              take: 1,
            },
          },
          orderBy: { billingInterval: "asc" },
        },
      },
    })

    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        entitlements: p.entitlements.map((e) => ({
          key: e.entitlementKey,
          value: e.value,
        })),
        subscriptionModels: p.subscriptionModels.map((m) => ({
          id: m.id,
          billingInterval: m.billingInterval,
          price: m.prices[0]
            ? { amount: m.prices[0].amount, currency: m.prices[0].currency }
            : null,
        })),
      })),
    })
  } catch (e: unknown) {
    console.error("[ORGANIZATION_SUBSCRIPTION_PLANS_GET]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler beim Laden" },
      { status: 500 }
    )
  }
}
