"use client"

import Link from "next/link"
import { getInvoiceStatusLabel, getSubscriptionStatusLabel } from "@/lib/subscription-status-labels"
import { formatDateDDMMYYYY } from "@/lib/format-date"

const formatCents = (cents: number, currency: string) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: currency || "EUR" }).format(cents / 100)
const formatDate = formatDateDDMMYYYY

const BEISPIEL_ABRECHNUNG = {
  subscription: {
    plan: "Pro",
    interval: "monthly" as "monthly" | "yearly",
    status: "active",
    nextBillingDate: "2026-03-15",
    currentPeriodEnd: "2026-03-15",
  },
  paymentMethod: "Karte / SEPA",
  lastInvoice: {
    id: "inv-beispiel-1",
    invoiceNumber: "INV-2026-00042",
    periodStart: "2026-01-01",
    periodEnd: "2026-01-31",
    totalAmount: 4900,
    currency: "EUR",
    status: "paid",
    hasOverage: true,
  },
  openAmount: 0,
  currency: "EUR",
}

const BEISPIEL_RECHNUNGEN = [
  { id: "1", invoiceNumber: "INV-2026-00042", periodStart: "2026-01-01", periodEnd: "2026-01-31", createdAt: "2026-02-01", netAmount: 4118, taxAmount: 782, totalAmount: 4900, currency: "EUR", status: "paid", pdfUrl: null },
  { id: "2", invoiceNumber: "INV-2025-00189", periodStart: "2025-12-01", periodEnd: "2025-12-31", createdAt: "2025-12-28", netAmount: 4118, taxAmount: 782, totalAmount: 4900, currency: "EUR", status: "paid", pdfUrl: null },
  { id: "3", invoiceNumber: "INV-2025-00156", periodStart: "2025-11-01", periodEnd: "2025-11-30", createdAt: "2025-11-27", netAmount: 4118, taxAmount: 782, totalAmount: 4900, currency: "EUR", status: "paid", pdfUrl: null },
]

const BEISPIEL_KPIS = [
  { label: "Erstellte DPPs", value: "12", trend: "+2", positive: true },
  { label: "Veröffentlichte DPPs", value: "8", trend: "+1", positive: true },
  { label: "Scans (30 Tage)", value: "1.240", trend: "+18 %", positive: true },
]

export default function TestPageClient() {
  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/app/dashboard" style={{ color: "#7A7A7A", textDecoration: "none", fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>
          ← Zur Übersicht
        </Link>
      </div>

      <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)", fontWeight: "700", color: "#0A0A0A", marginBottom: "0.5rem" }}>
        Testseite mit Beispieldaten
      </h1>
      <p style={{ color: "#7A7A7A", fontSize: "1rem", marginBottom: "1.5rem" }}>
        Diese Seite zeigt ausschließlich Beispieldaten zur Darstellung der Oberfläche. Keine echten API-Daten.
      </p>

      <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "8px", color: "#92400E", fontSize: "0.9rem" }}>
        <strong>Hinweis:</strong> Alle angezeigten Werte sind Musterdaten und dienen nur zur Ansicht.
      </div>

      {/* Beispieldaten: Abrechnung-Übersicht */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem", color: "#0A0A0A" }}>
          Abrechnung (Beispiel)
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#F8F9FA", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Aktueller Tarif</div>
            <div style={{ fontWeight: "600", color: "#0A0A0A" }}>
              {BEISPIEL_ABRECHNUNG.subscription.plan} ({BEISPIEL_ABRECHNUNG.subscription.interval === "yearly" ? "Jährlich" : "Monatlich"})
            </div>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "#F8F9FA", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Nächste Abrechnung</div>
            <div style={{ fontWeight: "600", color: "#0A0A0A" }}>{formatDate(BEISPIEL_ABRECHNUNG.subscription.nextBillingDate)}</div>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "#F8F9FA", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Zahlungsmethode</div>
            <div style={{ fontWeight: "600", color: "#0A0A0A" }}>{BEISPIEL_ABRECHNUNG.paymentMethod}</div>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "#F8F9FA", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Offene Beträge</div>
            <div style={{ fontWeight: "600", color: BEISPIEL_ABRECHNUNG.openAmount > 0 ? "#C33" : "#0A0A0A" }}>
              {formatCents(BEISPIEL_ABRECHNUNG.openAmount, BEISPIEL_ABRECHNUNG.currency)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.5rem" }}>Letzte Rechnung (Beispiel)</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem 1rem" }}>
            <span style={{ fontWeight: "500" }}>{BEISPIEL_ABRECHNUNG.lastInvoice.invoiceNumber}</span>
            <span style={{ color: "#7A7A7A" }}>{formatDate(BEISPIEL_ABRECHNUNG.lastInvoice.periodStart)} – {formatDate(BEISPIEL_ABRECHNUNG.lastInvoice.periodEnd)}</span>
            <span>{formatCents(BEISPIEL_ABRECHNUNG.lastInvoice.totalAmount, BEISPIEL_ABRECHNUNG.lastInvoice.currency)}</span>
            <span style={{ color: "#7A7A7A" }}>{getInvoiceStatusLabel(BEISPIEL_ABRECHNUNG.lastInvoice.status)}</span>
            {BEISPIEL_ABRECHNUNG.lastInvoice.hasOverage && (
              <span style={{ fontSize: "0.8rem", backgroundColor: "#E0F2FE", color: "#0369A1", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Enthält Zusatznutzung</span>
            )}
            <a href="/api/app/test/invoice-pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#24c598", fontSize: "0.9rem" }}>
              PDF herunterladen (Beispiel)
            </a>
          </div>
        </div>
      </section>

      {/* Beispieldaten: Rechnungen-Tabelle */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem", color: "#0A0A0A" }}>
          Rechnungen (Beispiel)
        </h2>
        <div style={{ overflowX: "auto", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8F9FA", textAlign: "left" }}>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Rechnungsnummer</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Zeitraum</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Rechnungsdatum</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Nettobetrag</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>MwSt</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Gesamt</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Status</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {BEISPIEL_RECHNUNGEN.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                  <td style={{ padding: "0.75rem" }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: "0.75rem" }}>{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</td>
                  <td style={{ padding: "0.75rem" }}>{formatDate(inv.createdAt)}</td>
                  <td style={{ padding: "0.75rem" }}>{formatCents(inv.netAmount, inv.currency)}</td>
                  <td style={{ padding: "0.75rem" }}>{formatCents(inv.taxAmount, inv.currency)}</td>
                  <td style={{ padding: "0.75rem" }}>{formatCents(inv.totalAmount, inv.currency)}</td>
                  <td style={{ padding: "0.75rem" }}>{getInvoiceStatusLabel(inv.status)}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <a href="/api/app/test/invoice-pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#24c598" }}>
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Beispieldaten: KPIs */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem", color: "#0A0A0A" }}>
          Kennzahlen (Beispiel)
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {BEISPIEL_KPIS.map((kpi) => (
            <div key={kpi.label} style={{ padding: "1rem", backgroundColor: "#F8F9FA", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>{kpi.label}</div>
              <div style={{ fontWeight: "600", fontSize: "1.25rem", color: "#0A0A0A" }}>{kpi.value}</div>
              <div style={{ fontSize: "0.85rem", color: kpi.positive ? "#16A34A" : "#DC2626", marginTop: "0.25rem" }}>{kpi.trend}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Abonnement-Status (Beispiel) */}
      <section>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem", color: "#0A0A0A" }}>
          Abonnement (Beispiel)
        </h2>
        <div style={{ padding: "1rem", backgroundColor: "#F5F5F5", border: "1px solid #CDCDCD", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.5rem" }}>Status</div>
          <p style={{ color: "#0A0A0A", fontSize: "0.95rem", margin: 0 }}>
            Status: <strong>{getSubscriptionStatusLabel(BEISPIEL_ABRECHNUNG.subscription.status)}</strong>
            {" • "}Läuft ab: {formatDate(BEISPIEL_ABRECHNUNG.subscription.currentPeriodEnd)}
          </p>
        </div>
      </section>
    </div>
  )
}
