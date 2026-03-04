export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"

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
  const organizationId = searchParams.get("organizationId") ?? undefined
  const search = searchParams.get("search")?.trim() ?? undefined
  const status = searchParams.get("status") ?? undefined
  const yearParam = searchParams.get("year")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const pageSize = Math.min(Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10)), 100)
  const limit = pageSize
  const skip = (page - 1) * pageSize

  const where: {
    organizationId?: string
    status?: string
    periodStart?: { gte: Date; lt: Date }
    OR?: Array<{ organization?: { name: { contains: string; mode: "insensitive" } }; invoiceNumber?: { contains: string; mode: "insensitive" } }>
  } = {}
  if (organizationId) where.organizationId = organizationId
  if (status) where.status = status
  if (yearParam) {
    const y = parseInt(yearParam, 10)
    if (!Number.isNaN(y)) {
      where.periodStart = {
        gte: new Date(y, 0, 1),
        lt: new Date(y + 1, 0, 1),
      }
    }
  }
  if (search && search.length >= 2) {
    where.OR = [
      { organization: { name: { contains: search, mode: "insensitive" } } },
      { invoiceNumber: { contains: search, mode: "insensitive" } },
    ]
  }

  const [total, invoices, allForYears] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.invoice.findMany({
      where,
      select: { periodStart: true },
    }),
  ])

  const invoiceIds = invoices.map((i) => i.id)
  const lastSentByInvoice: Record<string, string> = {}
  if (invoiceIds.length > 0) {
    const resendEvents = await prisma.billingEventLog.findMany({
      where: {
        type: "manual.resend",
        invoiceId: { in: invoiceIds },
      },
      select: { invoiceId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })
    for (const e of resendEvents) {
      if (e.invoiceId && !(e.invoiceId in lastSentByInvoice)) {
        lastSentByInvoice[e.invoiceId] = e.createdAt.toISOString()
      }
    }
  }

  const yearSet = new Set<number>()
  for (const inv of allForYears) {
    yearSet.add(new Date(inv.periodStart).getFullYear())
  }
  const years = Array.from(yearSet).sort((a, b) => b - a)

  return NextResponse.json({
    years,
    total,
    page,
    pageSize,
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      organizationId: inv.organizationId,
      organizationName: inv.organization.name,
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      createdAt: inv.createdAt,
      netAmount: inv.netAmount,
      taxAmount: inv.taxAmount,
      totalAmount: inv.totalAmount,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.pdfUrl,
      providerInvoiceId: inv.providerInvoiceId,
      lastSentAt: lastSentByInvoice[inv.id] ?? null,
    })),
  })
}
