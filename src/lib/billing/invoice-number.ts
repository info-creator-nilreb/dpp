/**
 * Fortlaufende Rechnungsnummer (systemweit eindeutig)
 * Keine harte Abhängigkeit von einem Payment-Provider.
 */

import { prisma } from "@/lib/prisma"

const PREFIX = "INV"
const YEAR_PAD = 4

/**
 * Generiert die nächste Rechnungsnummer im Format INV-YYYY-NNNNN (z.B. INV-2026-00001).
 */
export async function generateNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear().toString()
  const prefix = `${PREFIX}-${year}-`

  const last = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
    select: { invoiceNumber: true },
  })

  let nextSeq = 1
  if (last?.invoiceNumber) {
    const rest = last.invoiceNumber.slice(prefix.length)
    const num = parseInt(rest, 10)
    if (!Number.isNaN(num)) nextSeq = num + 1
  }

  const seq = nextSeq.toString().padStart(5, "0")
  return `${prefix}${seq}`
}
