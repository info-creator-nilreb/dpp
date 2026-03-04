/**
 * Super-Admin: Gutschriften (S-7)
 * POST: Gutschrift erstellen (organisationId, optional invoiceId, amount, reason)
 * GET: Liste nach organizationId (optional)
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createBillingEvent } from "@/lib/billing/event-log"

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

  const where = organizationId ? { organizationId } : {}
  const creditNotes = await prisma.creditNote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      organization: { select: { id: true, name: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
  })

  return NextResponse.json({
    creditNotes: creditNotes.map((cn) => ({
      id: cn.id,
      organizationId: cn.organizationId,
      organizationName: cn.organization.name,
      invoiceId: cn.invoiceId,
      invoiceNumber: cn.invoice?.invoiceNumber,
      amount: cn.amount,
      reason: cn.reason,
      createdAt: cn.createdAt,
    })),
  })
}

export async function POST(request: Request) {
  try {
    await requireSuperAdminPermissionApiThrow("billing", "update")
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }
    throw e
  }

  const body = await request.json()
  const { organizationId, invoiceId, amount, reason } = body

  if (!organizationId || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "organizationId und amount (positiv, in Cent) sind erforderlich." },
      { status: 400 }
    )
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  })
  if (!org) {
    return NextResponse.json({ error: "Organisation nicht gefunden." }, { status: 404 })
  }

  if (invoiceId) {
    const inv = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      select: { id: true },
    })
    if (!inv) {
      return NextResponse.json({ error: "Rechnung nicht gefunden oder gehört nicht zu dieser Organisation." }, { status: 400 })
    }
  }

  const amountCents = Math.round(amount)
  const creditNote = await prisma.creditNote.create({
    data: {
      organizationId,
      invoiceId: invoiceId || null,
      amount: amountCents,
      reason: typeof reason === "string" ? reason.trim() || null : null,
    },
  })

  await createBillingEvent({
    organizationId,
    invoiceId: invoiceId || undefined,
    type: "credit_note.created",
    payload: { creditNoteId: creditNote.id, amount: amountCents, reason: reason || null },
  })

  return NextResponse.json({ creditNote: { id: creditNote.id, amount: creditNote.amount, reason: creditNote.reason, createdAt: creditNote.createdAt } })
}
