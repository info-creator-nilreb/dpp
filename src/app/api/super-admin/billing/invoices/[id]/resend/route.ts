/**
 * Super-Admin: Rechnung erneut versenden (S-5)
 * POST: Sendet die Rechnung als PDF per E-Mail an die Rechnungs-E-Mail der Organisation.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { createBillingEvent } from "@/lib/billing/event-log"
import { buildInvoicePdf } from "@/lib/billing/invoice-pdf"
import { sendInvoiceResendEmail } from "@/lib/email"

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
    include: {
      organization: {
        select: {
          name: true,
          legalName: true,
          billingEmail: true,
          billingContactUserId: true,
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
    return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
  }

  let email = invoice.organization.billingEmail?.trim()
  if (!email && invoice.organization.billingContactUserId) {
    const contactUser = await prisma.user.findUnique({
      where: { id: invoice.organization.billingContactUserId },
      select: { email: true },
    })
    email = contactUser?.email?.trim() ?? undefined
  }
  if (!email) {
    const anyOrgUser = await prisma.user.findFirst({
      where: { organizationId: invoice.organizationId },
      select: { email: true },
    })
    email = anyOrgUser?.email?.trim() ?? undefined
  }
  if (!email) {
    return NextResponse.json(
      { error: "Keine Rechnungs-E-Mail für diese Organisation hinterlegt. Bitte unter Organisationsdetails „Rechnungs-E-Mail“ oder „Rechnungs-Kontakt“ eintragen." },
      { status: 400 }
    )
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

  try {
    await sendInvoiceResendEmail(email, invoice.invoiceNumber, pdfBuffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : "E-Mail-Versand fehlgeschlagen"
    console.error("[resend] sendInvoiceResendEmail failed:", err)
    return NextResponse.json(
      { error: `E-Mail konnte nicht zugestellt werden: ${message}. Bitte SMTP-Konfiguration und Server-Logs prüfen.` },
      { status: 502 }
    )
  }

  await createBillingEvent({
    organizationId: invoice.organizationId,
    invoiceId,
    type: "manual.resend",
    payload: { invoiceNumber: invoice.invoiceNumber, sentTo: email },
  })

  return NextResponse.json({ success: true, sentTo: email })
}
