"use client"

import { getInvoiceStatusLabel } from "@/lib/subscription-status-labels"

export type BillingStatusBadgeVariant = "paid" | "open" | "failed" | "warning" | "inactive"

const VARIANT_STYLES: Record<
  BillingStatusBadgeVariant,
  { backgroundColor: string; color: string }
> = {
  paid: { backgroundColor: "#F3F4F6", color: "#374151" },
  open: { backgroundColor: "#FEF3C2", color: "#92400E" },
  failed: { backgroundColor: "#FEE2E2", color: "#B91C1C" },
  warning: { backgroundColor: "#FEF3C2", color: "#92400E" },
  inactive: { backgroundColor: "#F3F4F6", color: "#6B7280" },
}

interface StatusBadgeProps {
  variant: BillingStatusBadgeVariant
  /** Override label; default from invoice status or variant */
  label?: string
}

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const style = VARIANT_STYLES[variant]
  const text =
    label ??
    (variant === "paid"
      ? "Bezahlt"
      : variant === "open"
        ? "Offen"
        : variant === "failed"
          ? "Fehlgeschlagen"
          : variant === "warning"
            ? "Warnung"
            : "—")
  return (
    <span
      style={{
        fontSize: "0.8rem",
        padding: "0.25rem 0.5rem",
        borderRadius: "4px",
        fontWeight: 500,
        ...style,
      }}
    >
      {text}
    </span>
  )
}

/** Maps API invoice status to badge variant */
export function invoiceStatusToVariant(status: string): BillingStatusBadgeVariant {
  const n = status?.toLowerCase() ?? ""
  if (n === "paid") return "paid"
  if (n === "open") return "open"
  if (n === "failed") return "failed"
  if (n === "cancelled" || n === "canceled") return "inactive"
  return "inactive"
}

/** For invoice table/cards: label from status */
export function InvoiceStatusBadge({ status }: { status: string }) {
  const variant = invoiceStatusToVariant(status)
  const label = getInvoiceStatusLabel(status)
  return <StatusBadge variant={variant} label={label} />
}
