/**
 * Super-Admin: Billing-Events / Webhook-/Zahlungshistorie (S-10)
 * GET: Liste BillingEventLog, optional gefiltert nach organizationId.
 */

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
  const type = searchParams.get("type") ?? undefined
  const dateFrom = searchParams.get("dateFrom") ?? undefined
  const dateTo = searchParams.get("dateTo") ?? undefined
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const pageSize = Math.min(Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10)), 100)
  const skip = (page - 1) * pageSize

  const where: {
    organizationId?: string
    organization?: { name: { contains: string; mode: "insensitive" } }
    type?: string
    createdAt?: { gte?: Date; lte?: Date }
  } = {}
  if (organizationId) where.organizationId = organizationId
  else if (search && search.length >= 2) where.organization = { name: { contains: search, mode: "insensitive" } }
  if (type) where.type = type
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      const d = new Date(dateFrom)
      if (!Number.isNaN(d.getTime())) where.createdAt.gte = d
    }
    if (dateTo) {
      const d = new Date(dateTo)
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999)
        where.createdAt.lte = d
      }
    }
  }

  const [total, events] = await Promise.all([
    prisma.billingEventLog.count({ where }),
    prisma.billingEventLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        organization: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    }),
  ])

  return NextResponse.json({
    total,
    page,
    pageSize,
    events: events.map((e) => ({
      id: e.id,
      organizationId: e.organizationId,
      organizationName: e.organization?.name ?? null,
      invoiceId: e.invoiceId,
      invoiceNumber: e.invoice?.invoiceNumber ?? null,
      type: e.type,
      providerEventId: e.providerEventId,
      payload: e.payload,
      createdAt: e.createdAt,
    })),
  })
}
