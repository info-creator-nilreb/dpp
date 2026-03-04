/**
 * Lesbare Labels und Formatierung für Billing-Event-Typen und Payloads (Ereignisprotokoll).
 */

const EVENT_TYPE_LABELS: Record<string, string> = {
  "invoice.created": "Rechnung erstellt",
  "invoice.finalized": "Rechnung finalisiert",
  "invoice.paid": "Rechnung bezahlt",
  "invoice.failed": "Rechnung fehlgeschlagen",
  "payment.succeeded": "Zahlung erfolgreich",
  "payment.failed": "Zahlung fehlgeschlagen",
  "webhook.received": "Webhook empfangen",
  "manual.paid": "Als bezahlt markiert",
  "manual.resend": "Rechnung versendet",
  "credit_note.created": "Gutschrift erstellt",
}

/** Für Filter-Dropdown: Typ-Werte mit Labels (ohne „Alle“). */
export const BILLING_EVENT_TYPE_OPTIONS = [
  { value: "invoice.created", label: "Rechnung erstellt" },
  { value: "manual.resend", label: "Rechnung versendet" },
  { value: "manual.paid", label: "Als bezahlt markiert" },
  { value: "invoice.paid", label: "Rechnung bezahlt" },
  { value: "invoice.failed", label: "Rechnung fehlgeschlagen" },
  { value: "credit_note.created", label: "Gutschrift erstellt" },
  { value: "payment.succeeded", label: "Zahlung erfolgreich" },
  { value: "payment.failed", label: "Zahlung fehlgeschlagen" },
  { value: "webhook.received", label: "Webhook empfangen" },
  { value: "invoice.finalized", label: "Rechnung finalisiert" },
]

export function getBillingEventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type
}

const PAYLOAD_KEY_LABELS: Record<string, string> = {
  invoiceNumber: "Rechnung",
  sentTo: "Gesendet an",
  totalAmount: "Betrag",
  source: "Quelle",
  reason: "Grund",
  amount: "Betrag",
}

function formatPayloadValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * Erzeugt eine lesbare Detail-Zeile aus dem Event-Payload (z. B. "Rechnung: INV-2025-00001 · Gesendet an: billing@example.com").
 */
export function formatBillingEventPayload(type: string, payload: unknown): string {
  if (payload === null || typeof payload !== "object") return "—"
  const obj = payload as Record<string, unknown>
  const parts: string[] = []
  const order = type === "manual.resend" ? ["invoiceNumber", "sentTo"] : type === "manual.paid" ? ["invoiceNumber"] : ["invoiceNumber", "totalAmount", "source", "reason", "amount"]
  for (const key of order) {
    if (!(key in obj)) continue
    const label = PAYLOAD_KEY_LABELS[key] ?? key
    const value = formatPayloadValue(key, obj[key])
    if (value && value !== "—") parts.push(`${label}: ${value}`)
  }
  // Restliche Keys, die nicht in order sind
  for (const key of Object.keys(obj)) {
    if (order.includes(key)) continue
    const label = PAYLOAD_KEY_LABELS[key] ?? key
    const value = formatPayloadValue(key, obj[key])
    if (value && value !== "—") parts.push(`${label}: ${value}`)
  }
  return parts.length > 0 ? parts.join(" · ") : "—"
}
