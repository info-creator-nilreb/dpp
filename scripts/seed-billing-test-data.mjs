/**
 * Legt Testdaten für den Abrechnungsbereich an (eine offene Rechnung + Billing-Event).
 * So kannst du S-5 (Rechnung versenden), S-6 (Als bezahlt markieren) und S-10 (Events) testen.
 *
 * Aufruf aus dem Projektroot (DATABASE_URL aus .env):
 *   node --env-file=.env scripts/seed-billing-test-data.mjs
 * oder:
 *   npx dotenv -e .env -- node scripts/seed-billing-test-data.mjs
 * oder zuerst: export $(grep -v '^#' .env | xargs)
 *   node scripts/seed-billing-test-data.mjs
 *
 * Standard: Organisation „Best Brand“ (Name). Optional: BILLING_SEED_ORGANIZATION_ID=clxy... für eine andere Org.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function getNextInvoiceNumber() {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  })
  let seq = 1
  if (last?.invoiceNumber) {
    const rest = last.invoiceNumber.slice(prefix.length)
    const num = parseInt(rest, 10)
    if (!Number.isNaN(num)) seq = num + 1
  }
  return `${prefix}${seq.toString().padStart(5, "0")}`
}

async function main() {
  const orgId = process.env.BILLING_SEED_ORGANIZATION_ID
  const org = orgId
    ? await prisma.organization.findUnique({ where: { id: orgId }, include: { subscription: true } })
    : await prisma.organization.findFirst({ where: { name: "Best Brand" }, include: { subscription: true } })

  if (!org) {
    if (orgId) {
      console.error("Organisation mit ID nicht gefunden:", orgId)
    } else {
      console.error('Keine Organisation mit Namen "Best Brand" gefunden. Leg "Best Brand" an oder setze BILLING_SEED_ORGANIZATION_ID.')
    }
    process.exit(1)
  }

  const invoiceNumber = await getNextInvoiceNumber()
  const now = new Date()
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const periodStart = new Date(periodEnd)
  periodStart.setMonth(periodStart.getMonth() - 1)

  const netAmount = 4118
  const taxAmount = 782
  const totalAmount = netAmount + taxAmount

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      organizationId: org.id,
      subscriptionId: org.subscription?.id ?? null,
      periodStart,
      periodEnd,
      netAmount,
      taxRate: 19,
      taxAmount,
      totalAmount,
      currency: "EUR",
      status: "open",
    },
  })

  await prisma.invoiceLine.createMany({
    data: [
      { invoiceId: invoice.id, description: "Pro Monat (Test)", quantity: 1, unitAmount: 3518, amount: 3518 },
      { invoiceId: invoice.id, description: "Zusatznutzung – Scans (Test)", quantity: 100, unitAmount: 6, amount: 600 },
    ],
  })

  await prisma.billingEventLog.create({
    data: {
      organizationId: org.id,
      invoiceId: invoice.id,
      type: "invoice.created",
      payload: { invoiceNumber, totalAmount, source: "seed-billing-test-data" },
    },
  })

  console.log("")
  console.log("Test-Rechnung angelegt:")
  console.log("  Rechnungsnummer:", invoiceNumber)
  console.log("  Organisation:   ", org.name, `(${org.id})`)
  console.log("  Status:        ", "open (zum Testen von „Als bezahlt“)")
  console.log("")
  console.log("So kannst du testen:")
  console.log("  1. Super-Admin einloggen: /super-admin/login")
  console.log("  2. Abrechnung & Erlöse:  /super-admin/billing")
  console.log("  3. Organisation öffnen: /super-admin/organizations → eine Org wählen → Tab „Abrechnung“")
  console.log("     oder direkt:          /super-admin/organizations/" + org.id + "?tab=billing")
  console.log("")
  console.log("Dort: „Als bezahlt“, „Rechnung versenden“, und unten die Billing-Events.")
  console.log("")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
