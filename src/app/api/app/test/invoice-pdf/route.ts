/**
 * Testseite – Beispiel-PDF einer Rechnung (minimalistisches Layout, Stil der App).
 * Nur für eingeloggte Nutzer, dient zur Vorschau der PDF-Erstellung.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { buildInvoicePdf } from "@/lib/billing/invoice-pdf"

const BEISPIEL_PDF = {
  invoiceNumber: "INV-2026-00042",
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
  createdAt: "2026-02-01",
  netAmount: 4118,
  taxAmount: 782,
  totalAmount: 4900,
  currency: "EUR",
  lines: [
    { description: "Pro Monat (01.01.2026 – 31.01.2026)", quantity: 1, unitAmount: 4118, amount: 4118, isOverage: false },
    { description: "Zusatznutzung – Scans", quantity: 120, unitAmount: 5, amount: 600, isOverage: true },
  ],
  organization: {
    name: "Beispiel GmbH",
    legalName: "Beispiel GmbH",
    invoiceAddressStreet: "Musterstraße 1",
    invoiceAddressZip: "10115",
    invoiceAddressCity: "Berlin",
    invoiceAddressCountry: "Deutschland",
  },
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const pdfBuffer = await buildInvoicePdf(BEISPIEL_PDF)
    const filename = "Rechnung-INV-2026-00042-Beispiel.pdf"
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
    console.error("[TEST_INVOICE_PDF]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 }
    )
  }
}
