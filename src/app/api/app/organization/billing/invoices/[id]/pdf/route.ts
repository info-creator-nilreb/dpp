/**
 * Abrechnung – PDF-Download einer Rechnung.
 * Wenn pdfUrl gesetzt ist: Redirect. Sonst: PDF wird minimalistisch generiert (Logo, Stil der App).
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"
import { buildInvoicePdf } from "@/lib/billing/invoice-pdf"

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
        organization: {
          select: {
            name: true,
            legalName: true,
            invoiceAddressStreet: true,
            invoiceAddressZip: true,
            invoiceAddressCity: true,
            invoiceAddressCountry: true,
          },
        },
        lines: { orderBy: { id: "asc" } },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      )
    }

    if (invoice.pdfUrl) {
      return NextResponse.redirect(invoice.pdfUrl)
    }

    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      createdAt: invoice.createdAt,
      netAmount: invoice.netAmount,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      lines: invoice.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitAmount: line.unitAmount,
        amount: line.amount,
        isOverage: !!(line.metadata as Record<string, unknown>)?.overage,
      })),
      organization: {
        name: invoice.organization.name,
        legalName: invoice.organization.legalName,
        invoiceAddressStreet: invoice.organization.invoiceAddressStreet,
        invoiceAddressZip: invoice.organization.invoiceAddressZip,
        invoiceAddressCity: invoice.organization.invoiceAddressCity,
        invoiceAddressCountry: invoice.organization.invoiceAddressCountry,
      },
    }

    const pdfBuffer = await buildInvoicePdf(pdfData)
    const filename = `Rechnung-${invoice.invoiceNumber}.pdf`
    const body = Buffer.isBuffer(pdfBuffer) ? new Uint8Array(pdfBuffer) : pdfBuffer

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (e: unknown) {
    console.error("[BILLING_INVOICE_PDF]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 }
    )
  }
}
