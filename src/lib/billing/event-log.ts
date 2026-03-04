/**
 * Billing-Event-Log (Webhook-/Zahlungshistorie)
 * Provider-IDs separat; keine harte Stripe-Abhängigkeit.
 */

import { prisma } from "@/lib/prisma"

export type BillingEventType =
  | "invoice.created"
  | "invoice.finalized"
  | "invoice.paid"
  | "invoice.failed"
  | "payment.succeeded"
  | "payment.failed"
  | "webhook.received"
  | "manual.paid"
  | "manual.resend"
  | "credit_note.created"

export interface CreateBillingEventInput {
  organizationId: string
  invoiceId?: string | null
  type: BillingEventType
  providerEventId?: string | null
  payload: Record<string, unknown>
}

export async function createBillingEvent(input: CreateBillingEventInput): Promise<void> {
  await prisma.billingEventLog.create({
    data: {
      organizationId: input.organizationId,
      invoiceId: input.invoiceId ?? undefined,
      type: input.type,
      providerEventId: input.providerEventId ?? undefined,
      payload: input.payload as object,
    },
  })
}
