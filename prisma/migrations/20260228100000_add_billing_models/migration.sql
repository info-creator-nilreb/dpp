-- AlterTable: Subscription - add nextBillingDate, cancelAt, discountPercentage
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "nextBillingDate" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cancelAt" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "discountPercentage" DECIMAL(5,2);

-- CreateTable: invoices
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "providerInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "invoices_organizationId_idx" ON "invoices"("organizationId");
CREATE INDEX IF NOT EXISTS "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_createdAt_idx" ON "invoices"("createdAt");
CREATE INDEX IF NOT EXISTS "invoices_periodStart_periodEnd_idx" ON "invoices"("periodStart", "periodEnd");

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: invoice_lines
CREATE TABLE IF NOT EXISTS "invoice_lines" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: payments
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "status" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT,
    "paidAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payments_invoiceId_idx" ON "payments"("invoiceId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: credit_notes
CREATE TABLE IF NOT EXISTS "credit_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "providerCreditNoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "credit_notes_organizationId_idx" ON "credit_notes"("organizationId");
CREATE INDEX IF NOT EXISTS "credit_notes_invoiceId_idx" ON "credit_notes"("invoiceId");

ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: billing_event_logs
CREATE TABLE IF NOT EXISTS "billing_event_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" TEXT NOT NULL,
    "providerEventId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_event_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "billing_event_logs_organizationId_idx" ON "billing_event_logs"("organizationId");
CREATE INDEX IF NOT EXISTS "billing_event_logs_invoiceId_idx" ON "billing_event_logs"("invoiceId");
CREATE INDEX IF NOT EXISTS "billing_event_logs_type_idx" ON "billing_event_logs"("type");
CREATE INDEX IF NOT EXISTS "billing_event_logs_createdAt_idx" ON "billing_event_logs"("createdAt");

ALTER TABLE "billing_event_logs" ADD CONSTRAINT "billing_event_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_event_logs" ADD CONSTRAINT "billing_event_logs_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
