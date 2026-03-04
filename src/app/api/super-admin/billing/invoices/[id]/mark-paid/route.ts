/**
 * Super-Admin: Rechnung manuell als bezahlt markieren (S-6)
 * POST: Setzt Status auf "paid", erstellt optional Payment (method: manual), schreibt Billing-Event.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createBillingEvent } from "@/lib/billing/event-log"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminPermissionApiThrow("billing", "write")
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }
    throw e
  }

  const { id: invoiceId } = await params
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, organizationId: true, invoiceNumber: true, status: true, totalAmount: true },
  })

  if (!invoice) {
    return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Rechnung ist bereits als bezahlt markiert" }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "paid" },
    })
    await tx.payment.create({
      data: {
        invoiceId,
        status: "succeeded",
        amount: invoice.totalAmount,
        method: "manual",
        paidAt: new Date(),
      },
    })
  })

  await createBillingEvent({
    organizationId: invoice.organizationId,
    invoiceId,
    type: "manual.paid",
    payload: { invoiceNumber: invoice.invoiceNumber, previousStatus: invoice.status },
  })

  return NextResponse.json({ success: true, status: "paid" })
}
