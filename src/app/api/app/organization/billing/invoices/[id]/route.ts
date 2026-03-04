/**
 * Abrechnung – Einzelne Rechnung inkl. Positionen (für Zusatznutzung/Overage)
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    const { id } = await params
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        lines: {
          orderBy: { id: "asc" },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      )
    }

    const lines = invoice.lines.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitAmount: line.unitAmount,
      amount: line.amount,
      metadata: line.metadata,
      isOverage: !!(line.metadata as Record<string, unknown>)?.overage,
    }))

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        createdAt: invoice.createdAt,
        netAmount: invoice.netAmount,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
      },
      lines,
    })
  } catch (e: unknown) {
    console.error("[BILLING_INVOICE_DETAIL]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 }
    )
  }
}
