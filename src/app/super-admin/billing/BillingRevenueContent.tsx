"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { getInvoiceStatusLabel } from "@/lib/subscription-status-labels"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import ConfirmationModal from "@/components/super-admin/ConfirmationModal"
import Notification from "@/components/Notification"
import TimeFilter, { getDateRange, type TimeRange } from "@/components/dashboard/TimeFilter"
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from "@/lib/format-date"
import { getBillingEventTypeLabel, formatBillingEventPayload, BILLING_EVENT_TYPE_OPTIONS } from "@/lib/billing/event-labels"
import Pagination from "@/components/ui/Pagination"

interface BillingEventRow {
  id: string
  type: string
  organizationName: string | null
  invoiceNumber: string | null
  createdAt: string
  payload: unknown
}

interface Overview {
  mrr: number
  arr: number
  activeSubscriptions: number
  canceledCount: number
  openAmount: number
  failedPaymentsCount: number
  currency: string
  revenueInPeriod: number
  previous?: {
    mrr: number
    arr: number
    activeSubscriptions: number
    canceledCount: number
    openAmount: number
    failedPaymentsCount: number
    revenueInPeriod: number
  }
  trend?: {
    mrr: { value: number; isPositive: boolean }
    arr: { value: number; isPositive: boolean }
    activeSubscriptions: { value: number; isPositive: boolean }
    canceledCount: { value: number; isPositive: boolean }
    openAmount: { value: number; isPositive: boolean }
    failedPaymentsCount: { value: number; isPositive: boolean }
    revenueInPeriod: { value: number; isPositive: boolean }
  }
}

interface InvoiceRow {
  id: string
  invoiceNumber: string
  organizationId: string
  organizationName: string
  periodStart: string
  periodEnd: string
  createdAt: string
  netAmount: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: string
  pdfUrl: string | null
  providerInvoiceId: string | null
  lastSentAt: string | null
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(cents / 100)
}

function formatDate(iso: string) {
  return formatDateDDMMYYYY(iso)
}

function trendLabel(trend: { value: number; isPositive: boolean } | undefined, previous: number | undefined, current: number): string {
  if (previous === undefined || (previous === 0 && current === 0)) return "–"
  if (!trend || trend.value === 0) return "0 %"
  return `${trend.isPositive ? "↑" : "↓"} ${trend.value} %`
}
function trendColor(trend: { value: number; isPositive: boolean } | undefined): string {
  if (!trend || trend.value === 0) return "#6B7280"
  return trend.isPositive ? "#059669" : "#dc2626"
}

type BillingTab = "kennzahlen" | "rechnungen" | "ereignisprotokoll"

export default function BillingRevenueContent() {
  const searchParams = useSearchParams()
  const initialOrg = useMemo(() => searchParams.get("organizationId") ?? "", [searchParams])
  const [activeTab, setActiveTab] = useState<BillingTab>("kennzahlen")
  const [overview, setOverview] = useState<Overview | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [invoiceYears, setInvoiceYears] = useState<number[]>([])
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [filterSearch, setFilterSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [invoicePageSize, setInvoicePageSize] = useState(25)
  const [actionInvoiceId, setActionInvoiceId] = useState<string | null>(null)
  const [billingConfirm, setBillingConfirm] = useState<null | { type: "mark-paid" | "resend"; invoice: InvoiceRow }>(null)
  const [billingConfirmLoading, setBillingConfirmLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [billingEvents, setBillingEvents] = useState<BillingEventRow[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [eventFilterType, setEventFilterType] = useState("")
  const [eventFilterSearch, setEventFilterSearch] = useState("")
  const [eventPage, setEventPage] = useState(1)
  const [eventTotal, setEventTotal] = useState(0)
  const [eventPageSize, setEventPageSize] = useState(25)

  const range = (searchParams.get("range") as TimeRange) || "30days"
  useEffect(() => {
    setLoadingOverview(true)
    const { startDate, endDate } = getDateRange(range, searchParams.get("start") ?? undefined, searchParams.get("end") ?? undefined)
    const params = new URLSearchParams()
    params.set("start", startDate.toISOString())
    params.set("end", endDate.toISOString())
    fetch(`/api/super-admin/billing/overview?${params}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setOverview(data)
      })
      .finally(() => setLoadingOverview(false))
  }, [range])

  useEffect(() => {
    setLoadingInvoices(true)
    const params = new URLSearchParams()
    if (initialOrg) params.set("organizationId", initialOrg)
    else if (filterSearch.trim()) params.set("search", filterSearch.trim())
    if (filterStatus) params.set("status", filterStatus)
    if (filterYear) params.set("year", filterYear)
    params.set("page", String(invoicePage))
    params.set("pageSize", String(invoicePageSize))
    fetch(`/api/super-admin/billing/invoices?${params}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { invoices: [], years: [], total: 0 })
      .then((data) => {
        setInvoices(data.invoices || [])
        setInvoiceYears(data.years ?? [])
        setInvoiceTotal(data.total ?? 0)
      })
      .finally(() => setLoadingInvoices(false))
  }, [initialOrg, filterSearch, filterStatus, filterYear, invoicePage, invoicePageSize])

  useEffect(() => {
    setLoadingEvents(true)
    const params = new URLSearchParams()
    if (eventFilterSearch.trim()) params.set("search", eventFilterSearch.trim())
    if (eventFilterType) params.set("type", eventFilterType)
    params.set("page", String(eventPage))
    params.set("pageSize", String(eventPageSize))
    fetch(`/api/super-admin/billing/events?${params}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { events: [], total: 0 })
      .then((data) => {
        setBillingEvents(data.events || [])
        setEventTotal(data.total ?? 0)
      })
      .finally(() => setLoadingEvents(false))
  }, [eventFilterSearch, eventFilterType, eventPage, eventPageSize])

  const tabStyle = (tab: BillingTab) => ({
    padding: "0.5rem 1rem",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #24c598" : "2px solid transparent",
    backgroundColor: "transparent",
    color: activeTab === tab ? "#0A0A0A" : "#7A7A7A",
    fontWeight: activeTab === tab ? 600 : 400,
    cursor: "pointer" as const,
    fontSize: "0.95rem",
  })

  return (
    <div>
      <style>{`
        @media (max-width: 900px) {
          .billing-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .billing-kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#0A0A0A", marginBottom: "0.5rem" }}>
        Abrechnung &amp; Erlöse
      </h1>
      <p style={{ color: "#7A7A7A", marginBottom: "1rem", fontSize: "0.95rem" }}>
        Finanzkennzahlen, Rechnungen und Abrechnungs-Ereignisse.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #E5E5E5" }}>
        <button type="button" onClick={() => setActiveTab("kennzahlen")} style={tabStyle("kennzahlen")}>
          Kennzahlen
        </button>
        <button type="button" onClick={() => setActiveTab("rechnungen")} style={tabStyle("rechnungen")}>
          Rechnungen
        </button>
        <button type="button" onClick={() => setActiveTab("ereignisprotokoll")} style={tabStyle("ereignisprotokoll")}>
          Ereignisprotokoll
        </button>
      </div>

      {activeTab === "kennzahlen" && (
      <section>
        <h2 style={{ fontSize: "1.15rem", fontWeight: "600", marginBottom: "0.75rem", color: "#0A0A0A" }}>
          Finanzkennzahlen
        </h2>
        <TimeFilter basePath="/super-admin/billing" />
        {loadingOverview ? (
          <div style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LoadingSpinner message="Kennzahlen werden geladen..." />
          </div>
        ) : overview ? (
          <div
            className="billing-kpi-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.25rem",
            }}
          >
            {[
              { key: "mrr", label: "MRR", value: overview.mrr, format: (v: number) => formatCents(v, overview.currency), prev: overview.previous?.mrr, trend: overview.trend?.mrr },
              { key: "arr", label: "ARR", value: overview.arr, format: (v: number) => formatCents(v, overview.currency), prev: overview.previous?.arr, trend: overview.trend?.arr },
              { key: "activeSubscriptions", label: "Aktive Abos", value: overview.activeSubscriptions, format: String, prev: overview.previous?.activeSubscriptions, trend: overview.trend?.activeSubscriptions },
              { key: "canceledCount", label: "Kündigungen", value: overview.canceledCount, format: String, prev: overview.previous?.canceledCount, trend: overview.trend?.canceledCount },
              { key: "openAmount", label: "Offene Forderungen", value: overview.openAmount, format: (v: number) => formatCents(v, overview.currency), prev: overview.previous?.openAmount, trend: overview.trend?.openAmount, warn: overview.openAmount > 0 },
              { key: "failedPaymentsCount", label: "Fehlgeschlagene Zahlungen", value: overview.failedPaymentsCount, format: String, prev: overview.previous?.failedPaymentsCount, trend: overview.trend?.failedPaymentsCount, warn: overview.failedPaymentsCount > 0 },
              { key: "revenueInPeriod", label: "Umsatz (Zeitraum)", value: overview.revenueInPeriod ?? 0, format: (v: number) => formatCents(v, overview.currency), prev: overview.previous?.revenueInPeriod, trend: overview.trend?.revenueInPeriod },
            ].map(({ key, label, value, format, prev, trend, warn }) => (
              <div
                key={key}
                style={{
                  padding: "1.5rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 15, color: "#6B7280", marginTop: 0, marginBottom: 12 }}>{label}</div>
                <div style={{
                  fontSize: 44,
                  fontWeight: 600,
                  lineHeight: 1.05,
                  letterSpacing: "-0.5px",
                  color: warn ? "#C33" : "#0f172a",
                }}>
                  {format(value)}
                </div>
                <div style={{ marginTop: 8, fontSize: "0.75rem", fontWeight: 500, color: trendColor(trend) }}>
                  {trendLabel(trend, prev, value)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#7A7A7A" }}>Keine Daten.</p>
        )}
      </section>
      )}

      {activeTab === "rechnungen" && (
      <section>
        <h2 style={{ fontSize: "1.15rem", fontWeight: "600", marginBottom: "1rem", color: "#0A0A0A" }}>
          Rechnungen
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Suchen (Organisation, Rechnungsnr. …)"
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setInvoicePage(1) }}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #CDCDCD", borderRadius: "6px", minWidth: "240px" }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #CDCDCD", borderRadius: "6px" }}
          >
            <option value="">Status: Alle</option>
            <option value="open">Offen</option>
            <option value="paid">Bezahlt</option>
            <option value="failed">Fehlgeschlagen</option>
            <option value="cancelled">Storniert</option>
          </select>
          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setInvoicePage(1) }}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #CDCDCD", borderRadius: "6px" }}
          >
            <option value="">Jahr: Alle</option>
            {invoiceYears.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          {invoiceYears.length === 0 && !loadingInvoices && (
            <span style={{ fontSize: "0.85rem", color: "#7A7A7A" }}>Keine Rechnungsjahre vorhanden.</span>
          )}
        </div>
        {!loadingInvoices && invoiceTotal > 0 && (
          <div style={{ color: "#7A7A7A", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            {invoiceTotal} Rechnung{invoiceTotal !== 1 ? "en" : ""}
          </div>
        )}
        {loadingInvoices ? (
          <p style={{ color: "#7A7A7A" }}>Rechnungen werden geladen…</p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8F9FA", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem", borderBottom: "1px solid #E5E5E5" }}>Rechnungsnr.</th>
                  <th style={{ padding: "0.6rem", borderBottom: "1px solid #E5E5E5" }}>Organisation</th>
                  <th style={{ padding: "0.6rem", borderBottom: "1px solid #E5E5E5" }}>Zeitraum</th>
                  <th style={{ padding: "0.6rem", borderBottom: "1px solid #E5E5E5" }}>Gesamt</th>
                  <th style={{ padding: "0.6rem", borderBottom: "1px solid #E5E5E5" }}>Status</th>
                  <th style={{ padding: "0.6rem", borderBottom: "1px solid #E5E5E5" }}>Aktionen</th>
                  <th style={{ padding: "0.6rem", borderBottom: "1px solid #E5E5E5" }}>ID (Debug)</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "1rem", color: "#7A7A7A", textAlign: "center" }}>
                      Keine Rechnungen (oder Filter anpassen).
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                      <td style={{ padding: "0.6rem" }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: "0.6rem" }}>
                        <Link href={`/super-admin/organizations/${inv.organizationId}?tab=billing`} style={{ color: "#24c598" }}>
                          {inv.organizationName}
                        </Link>
                      </td>
                      <td style={{ padding: "0.6rem" }}>{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</td>
                      <td style={{ padding: "0.6rem" }}>{formatCents(inv.totalAmount, inv.currency)}</td>
                      <td style={{ padding: "0.6rem" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem" }}>
                          <span>{getInvoiceStatusLabel(inv.status)}</span>
                          {inv.lastSentAt && (
                            <span
                              title={`Zuletzt versendet: ${formatDateDDMMYYYY(inv.lastSentAt)}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "0.2rem 0.5rem",
                                fontSize: "0.7rem",
                                fontWeight: "500",
                                color: "#0d9488",
                                backgroundColor: "#ccfbf1",
                                border: "1px solid #99f6e4",
                                borderRadius: "9999px",
                              }}
                            >
                              Versendet
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "0.6rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                          {inv.status !== "paid" && (
                            <button
                              type="button"
                              disabled={actionInvoiceId !== null}
                              onClick={() => { setActionInvoiceId(inv.id); setBillingConfirm({ type: "mark-paid", invoice: inv }) }}
                              style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", whiteSpace: "nowrap", border: "1px solid #24c598", color: "#24c598", background: "none", borderRadius: "6px", cursor: actionInvoiceId ? "not-allowed" : "pointer" }}
                            >
                              Als bezahlt markieren
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={actionInvoiceId !== null}
                            onClick={() => { setActionInvoiceId(inv.id); setBillingConfirm({ type: "resend", invoice: inv }) }}
                            style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", whiteSpace: "nowrap", border: "1px solid #7A7A7A", color: "#7A7A7A", background: "none", borderRadius: "6px", cursor: actionInvoiceId ? "not-allowed" : "pointer" }}
                          >
                            Rechnung versenden
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "0.6rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#7A7A7A" }}>
                        {inv.id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loadingInvoices && invoiceTotal > 0 && (
          <Pagination
            currentPage={invoicePage}
            totalPages={Math.max(1, Math.ceil(invoiceTotal / invoicePageSize))}
            totalItems={invoiceTotal}
            pageSize={invoicePageSize}
            onPageChange={setInvoicePage}
            onPageSizeChange={(size) => { setInvoicePageSize(size); setInvoicePage(1) }}
          />
        )}
      </section>
      )}

      {activeTab === "ereignisprotokoll" && (
      <section>
        <h2 style={{ fontSize: "1.15rem", fontWeight: "600", marginBottom: "1rem", color: "#0A0A0A" }}>
          Ereignisprotokoll Abrechnung
        </h2>
        <p style={{ color: "#7A7A7A", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Chronologische Liste von Rechnungs- und Zahlungsereignissen (z.&nbsp;B. Rechnung erstellt, manuell bezahlt, versendet, Webhook-Empfang).
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Organisation (Name)"
            value={eventFilterSearch}
            onChange={(e) => { setEventFilterSearch(e.target.value); setEventPage(1) }}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #CDCDCD", borderRadius: "6px", minWidth: "200px" }}
          />
          <select
            value={eventFilterType}
            onChange={(e) => { setEventFilterType(e.target.value); setEventPage(1) }}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #CDCDCD", borderRadius: "6px" }}
          >
            <option value="">Typ: Alle</option>
            {BILLING_EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {!loadingEvents && eventTotal > 0 && (
          <div style={{ color: "#7A7A7A", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            {eventTotal} Einträge
          </div>
        )}
        {loadingEvents ? (
          <p style={{ color: "#7A7A7A" }}>Lade…</p>
        ) : billingEvents.length === 0 ? (
          <p style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>Keine Events.</p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #E5E5E5", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8F9FA", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem", borderBottom: "1px solid #E5E5E5" }}>Datum</th>
                  <th style={{ padding: "0.5rem", borderBottom: "1px solid #E5E5E5" }}>Typ</th>
                  <th style={{ padding: "0.5rem", borderBottom: "1px solid #E5E5E5" }}>Organisation</th>
                  <th style={{ padding: "0.5rem", borderBottom: "1px solid #E5E5E5" }}>Rechnung</th>
                  <th style={{ padding: "0.5rem", borderBottom: "1px solid #E5E5E5" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {billingEvents.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                    <td style={{ padding: "0.5rem" }}>{formatDateTimeDDMMYYYY(e.createdAt)}</td>
                    <td style={{ padding: "0.5rem" }}>{getBillingEventTypeLabel(e.type)}</td>
                    <td style={{ padding: "0.5rem" }}>{e.organizationName ?? "—"}</td>
                    <td style={{ padding: "0.5rem" }}>{e.invoiceNumber ?? "—"}</td>
                    <td style={{ padding: "0.5rem", color: "#7A7A7A", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis" }} title={formatBillingEventPayload(e.type, e.payload)}>
                      {formatBillingEventPayload(e.type, e.payload)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loadingEvents && eventTotal > 0 && (
          <Pagination
            currentPage={eventPage}
            totalPages={Math.max(1, Math.ceil(eventTotal / eventPageSize))}
            totalItems={eventTotal}
            pageSize={eventPageSize}
            onPageChange={setEventPage}
            onPageSizeChange={(size) => { setEventPageSize(size); setEventPage(1) }}
          />
        )}
      </section>
      )}

      {error && (
        <Notification type="error" message={error} onClose={() => setError(null)} duration={5000} />
      )}
      {success && (
        <Notification type="success" message={success} onClose={() => setSuccess(null)} duration={4000} />
      )}

      <ConfirmationModal
        isOpen={!!billingConfirm}
        onClose={() => { setBillingConfirm(null); setActionInvoiceId(null) }}
        onConfirm={async () => {
          if (!billingConfirm) return
          setBillingConfirmLoading(true)
          setError(null)
          setSuccess(null)
          const { type, invoice } = billingConfirm
          try {
            if (type === "mark-paid") {
              const res = await fetch(`/api/super-admin/billing/invoices/${invoice.id}/mark-paid`, { method: "POST", credentials: "include" })
              const data = await res.json().catch(() => ({}))
              if (!res.ok) { setError(data.error || "Fehler beim Markieren"); setBillingConfirmLoading(false); return }
              setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, status: "paid" } : i)))
              setSuccess("Rechnung als bezahlt markiert")
            } else {
              const res = await fetch(`/api/super-admin/billing/invoices/${invoice.id}/resend`, { method: "POST", credentials: "include" })
              const data = await res.json().catch(() => ({}))
              if (!res.ok) { setError(data.error || "Fehler beim Versenden"); setBillingConfirmLoading(false); return }
              setSuccess(data.sentTo ? `Rechnung an ${data.sentTo} gesendet` : "Rechnung versendet")
            }
            setBillingConfirm(null)
            setActionInvoiceId(null)
            setLoadingOverview(true)
            setLoadingInvoices(true)
            setLoadingEvents(true)
            const { startDate, endDate } = getDateRange(range, searchParams.get("start") ?? undefined, searchParams.get("end") ?? undefined)
            const overviewParams = new URLSearchParams()
            overviewParams.set("start", startDate.toISOString())
            overviewParams.set("end", endDate.toISOString())
            const invoiceParams = new URLSearchParams()
            if (initialOrg) invoiceParams.set("organizationId", initialOrg)
            else if (filterSearch.trim()) invoiceParams.set("search", filterSearch.trim())
            if (filterStatus) invoiceParams.set("status", filterStatus)
            if (filterYear) invoiceParams.set("year", filterYear)
            invoiceParams.set("page", String(invoicePage))
            invoiceParams.set("pageSize", String(invoicePageSize))
            const eventParams = new URLSearchParams()
            if (eventFilterSearch.trim()) eventParams.set("search", eventFilterSearch.trim())
            if (eventFilterType) eventParams.set("type", eventFilterType)
            eventParams.set("page", String(eventPage))
            eventParams.set("pageSize", String(eventPageSize))
            Promise.all([
              fetch(`/api/super-admin/billing/overview?${overviewParams}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
              fetch(`/api/super-admin/billing/invoices?${invoiceParams}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { invoices: [], years: [], total: 0 })),
              fetch(`/api/super-admin/billing/events?${eventParams}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { events: [], total: 0 })),
            ])
              .then(([overviewData, invoicesData, eventsData]) => {
                setOverview(overviewData)
                setInvoices(invoicesData?.invoices ?? [])
                if (invoicesData?.years) setInvoiceYears(invoicesData.years ?? [])
                setInvoiceTotal(invoicesData?.total ?? 0)
                setBillingEvents(eventsData?.events ?? [])
                setEventTotal(eventsData?.total ?? 0)
              })
              .finally(() => {
                setLoadingOverview(false)
                setLoadingInvoices(false)
                setLoadingEvents(false)
              })
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
          } finally {
            setBillingConfirmLoading(false)
          }
        }}
        title={billingConfirm?.type === "mark-paid" ? "Rechnung als bezahlt markieren?" : "Rechnung versenden?"}
        message={
          billingConfirm?.type === "mark-paid"
            ? `Rechnung ${billingConfirm.invoice.invoiceNumber} wird als bezahlt markiert. Die Aktion wird im Ereignisprotokoll erfasst.`
            : billingConfirm?.invoice.lastSentAt
            ? `Diese Rechnung wurde bereits versendet (zuletzt am ${formatDateDDMMYYYY(billingConfirm.invoice.lastSentAt)}). Sie versenden sie erneut an die hinterlegte Rechnungs-E-Mail der Organisation.`
            : `Sie versenden die Rechnung ${billingConfirm?.invoice.invoiceNumber} zum ersten Mal per E-Mail an die hinterlegte Rechnungs-E-Mail der Organisation.`
        }
        severity="medium"
        confirmText={billingConfirm?.type === "mark-paid" ? "Als bezahlt markieren" : "Rechnung versenden"}
        loading={billingConfirmLoading}
      />
    </div>
  )
}
