export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"

function percentChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 }
  const pct = Math.round(((current - previous) / previous) * 100)
  return { value: Math.abs(pct), isPositive: pct >= 0 }
}

export async function GET(request: Request) {
  try {
    await requireSuperAdminPermissionApiThrow("billing", "read")
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }
    throw e
  }

  const { searchParams } = new URL(request.url)
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")
  const endDate = endParam ? new Date(endParam) : new Date()
  const startDate = startParam ? new Date(startParam) : (() => {
    const s = new Date(endDate)
    s.setDate(s.getDate() - 30)
    s.setHours(0, 0, 0, 0)
    return s
  })()
  const periodMs = endDate.getTime() - startDate.getTime()
  const prevEnd = new Date(startDate)
  prevEnd.setTime(prevEnd.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - periodMs)

  const [
    activeSubscriptions,
    canceledCount,
    openInvoices,
    failedPaymentsCount,
    subsWithPrice,
    revenueCurrent,
    revenuePrevious,
  ] = await Promise.all([
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscription.count({
      where: { OR: [{ status: "canceled" }, { cancelAtPeriodEnd: true }] },
    }),
    prisma.invoice.aggregate({
      where: { status: "open" },
      _sum: { totalAmount: true },
    }),
    prisma.payment.count({ where: { status: "failed" } }),
    prisma.subscription.findMany({
      where: { status: "active" },
      include: { priceSnapshot: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: "paid",
        periodEnd: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: "paid",
        periodEnd: { gte: prevStart, lte: prevEnd },
      },
      _sum: { totalAmount: true },
    }),
  ])

  let mrrCents = 0
  let arrCents = 0
  for (const s of subsWithPrice) {
    if (!s.priceSnapshot) continue
    const amt = s.priceSnapshot.amount
    if (s.priceSnapshot.billingInterval === "yearly") {
      mrrCents += Math.round(amt / 12)
      arrCents += amt
    } else {
      mrrCents += amt
      arrCents += amt * 12
    }
  }

  const openAmount = openInvoices._sum.totalAmount ?? 0
  const revenueInPeriod = revenueCurrent._sum.totalAmount ?? 0
  const revenuePrev = revenuePrevious._sum.totalAmount ?? 0
  const trendRevenue = percentChange(revenueInPeriod, revenuePrev)

  return NextResponse.json({
    mrr: mrrCents,
    arr: arrCents,
    activeSubscriptions,
    canceledCount,
    openAmount,
    failedPaymentsCount,
    currency: "EUR",
    revenueInPeriod,
    previous: {
      mrr: mrrCents,
      arr: arrCents,
      activeSubscriptions,
      canceledCount,
      openAmount,
      failedPaymentsCount,
      revenueInPeriod: revenuePrev,
    },
    trend: {
      mrr: { value: 0, isPositive: true },
      arr: { value: 0, isPositive: true },
      activeSubscriptions: { value: 0, isPositive: true },
      canceledCount: { value: 0, isPositive: true },
      openAmount: { value: 0, isPositive: true },
      failedPaymentsCount: { value: 0, isPositive: true },
      revenueInPeriod: trendRevenue,
    },
  })
}
