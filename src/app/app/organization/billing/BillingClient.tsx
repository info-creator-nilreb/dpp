"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import CountrySelect from "@/components/CountrySelect"
import Notification from "@/components/Notification"
import { InvoiceStatusBadge, StatusBadge } from "@/components/billing/StatusBadge"
import { InvoiceDownloadButton } from "@/components/billing/InvoiceDownloadButton"
import { formatDateDDMMYYYY } from "@/lib/format-date"
import PaymentMethodsTab from "./PaymentMethodsTab"
import styles from "./billing.module.css"

interface BillingInfo {
  billingEmail: string | null
  billingContactUserId: string | null
  invoiceAddressStreet: string | null
  invoiceAddressZip: string | null
  invoiceAddressCity: string | null
  invoiceAddressCountry: string | null
  billingCountry: string | null
  vatId?: string | null
}

type Tab = "overview" | "invoices" | "billing-data" | "payment-methods"

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trial_active", "trial"]

export default function BillingClient() {
  const [tab, setTab] = useState<Tab>("overview")
  const [overview, setOverview] = useState<{
    subscription: { status: string; plan: string | null; interval: string | null; nextBillingDate: string | null; currentPeriodEnd: string | null }
    paymentMethod: string | null
    lastInvoice: { id: string; invoiceNumber: string; periodStart: string; periodEnd: string; totalAmount: number; currency: string; status: string; hasOverage?: boolean } | null
    openAmount: number
    currency: string
    billing: BillingInfo
  } | null>(null)
  const [invoices, setInvoices] = useState<Array<{
    id: string; invoiceNumber: string; periodStart: string; periodEnd: string; createdAt: string
    netAmount: number; taxAmount: number; totalAmount: number; currency: string; status: string; pdfUrl: string | null
  }>>([])
  const [invoiceYears, setInvoiceYears] = useState<number[]>([])
  const [invoicesYear, setInvoicesYear] = useState(String(new Date().getFullYear()))
  const [users, setUsers] = useState<Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [accessDenied, setAccessDenied] = useState(false)

  const [billingEmail, setBillingEmail] = useState("")
  const [billingContactUserId, setBillingContactUserId] = useState("")
  const [invoiceAddressStreet, setInvoiceAddressStreet] = useState("")
  const [invoiceAddressZip, setInvoiceAddressZip] = useState("")
  const [invoiceAddressCity, setInvoiceAddressCity] = useState("")
  const [billingCountry, setBillingCountry] = useState("")
  const [vatId, setVatId] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadOverview()
    loadUsers()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (tab === "invoices") loadInvoices()
  }, [tab, invoicesYear])

  async function loadOverview() {
    setLoading(true)
    setError("")
    setAccessDenied(false)
    try {
      const res = await fetch("/api/app/organization/billing/overview", { cache: "no-store" })
      if (res.status === 403) {
        setAccessDenied(true)
        return
      }
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Fehler beim Laden")
      }
      const data = await res.json()
      setOverview(data)
      const b = data.billing || {}
      setBillingEmail(b.billingEmail || "")
      setBillingContactUserId(b.billingContactUserId || "")
      setInvoiceAddressStreet(b.invoiceAddressStreet || "")
      setInvoiceAddressZip(b.invoiceAddressZip || "")
      setInvoiceAddressCity(b.invoiceAddressCity || "")
      setBillingCountry(b.billingCountry || "")
      setVatId(b.vatId || "")
      await loadInvoices()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }

  async function loadInvoices() {
    setInvoicesLoading(true)
    setError("")
    try {
      const url = invoicesYear
        ? `/api/app/organization/billing/invoices?year=${invoicesYear}`
        : "/api/app/organization/billing/invoices"
      const res = await fetch(url, { cache: "no-store", credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || "Fehler beim Laden der Rechnungen")
        setInvoices([])
        setInvoiceYears([])
        return
      }
      setInvoices(data.invoices || [])
      const years = data.years ?? []
      setInvoiceYears(years.length > 0 ? years : [new Date().getFullYear()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Rechnungen")
      setInvoices([])
      setInvoiceYears([])
    } finally {
      setInvoicesLoading(false)
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch("/api/app/organization/users", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error("Error loading users:", err)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch("/api/app/organization/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingEmail: billingEmail.trim() || null,
          billingContactUserId: billingContactUserId.trim() || null,
          invoiceAddressStreet: invoiceAddressStreet.trim() || null,
          invoiceAddressZip: invoiceAddressZip.trim() || null,
          invoiceAddressCity: invoiceAddressCity.trim() || null,
          billingCountry: billingCountry.trim() || null,
          vatId: vatId.trim() || null,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren der Rechnungsdaten")
      }
      setSuccess("Rechnungsdaten erfolgreich gespeichert.")
      await loadOverview()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !overview) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Abrechnung wird geladen..." />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div style={{ padding: "clamp(0.75rem, 3vw, 1.5rem) 0 2rem" }}>
        <Link href="/app/organization" style={{ color: "#7A7A7A", textDecoration: "none", fontSize: "0.95rem" }}>← Zur Organisation</Link>
        <p style={{ marginTop: "1rem", color: "#7A7A7A" }}>
          Sie haben keine Berechtigung für den Abrechnungsbereich. Nur Organisations-Administratoren haben Zugriff.
        </p>
      </div>
    )
  }

  const formatCents = (cents: number, cur: string) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: cur || "EUR" }).format(cents / 100)
  const formatDate = formatDateDDMMYYYY

  const kpiCardStyle: React.CSSProperties = {
    padding: "1.25rem",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E5E5",
    borderRadius: "8px",
    minHeight: "132px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Übersicht" },
    { id: "invoices", label: "Rechnungen" },
    { id: "billing-data", label: "Rechnungsdaten" },
    { id: "payment-methods", label: "Zahlungsarten" },
  ]

  const showNextBilling = overview?.subscription && ACTIVE_SUBSCRIPTION_STATUSES.includes(overview.subscription.status)

  return (
    <div style={{ width: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
      <div className={styles.contentWrapper}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/app/organization" style={{ color: "#7A7A7A", textDecoration: "none", fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>
            ← Zur Organisation
          </Link>
        </div>

        <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)", fontWeight: 700, color: "#0A0A0A", marginBottom: "0.5rem" }}>
          Abrechnung
        </h1>
        <p style={{ color: "#7A7A7A", fontSize: "1rem", marginBottom: "1.5rem" }}>
          Tarif, Rechnungen und Zahlungsstatus.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #E5E5E5", flexWrap: "wrap" }}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                padding: "0.75rem 1rem",
                border: "none",
                borderBottom: tab === id ? "2px solid #24c598" : "2px solid transparent",
                background: "none",
                color: tab === id ? "#0A0A0A" : "#7A7A7A",
                fontWeight: tab === id ? 600 : 400,
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <Notification type="error" message={error} onClose={() => setError("")} duration={5000} />}
        {success && <Notification type="success" message={success} onClose={() => setSuccess("")} duration={4000} />}

        {/* Tab: Übersicht */}
        {tab === "overview" && overview && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard} style={kpiCardStyle}>
                <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Aktueller Tarif</div>
                <div style={{ fontWeight: 600, color: "#0A0A0A", fontSize: "0.95rem", wordBreak: "break-word" }}>
                  {overview.subscription?.plan ?? "—"}
                  {overview.subscription?.interval ? ` (${overview.subscription.interval === "yearly" ? "Jährlich" : "Monatlich"})` : ""}
                </div>
              </div>
              <div className={styles.kpiCard} style={kpiCardStyle}>
                <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Nächste Abrechnung</div>
                <div style={{ fontWeight: 600, color: "#0A0A0A", fontSize: "0.95rem" }}>
                  {showNextBilling && overview.subscription?.nextBillingDate
                    ? formatDate(overview.subscription.nextBillingDate)
                    : "—"}
                </div>
              </div>
              <div className={styles.kpiCard} style={kpiCardStyle}>
                <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Zahlungsmethode</div>
                {overview.paymentMethod ? (
                  <div style={{ fontWeight: 600, color: "#0A0A0A", fontSize: "0.95rem", wordBreak: "break-word" }}>
                    {overview.paymentMethod}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <span style={{ marginTop: "0.5rem", marginBottom: "0.25rem", display: "inline-block" }}>
                      <StatusBadge variant="warning" label="Keine Zahlungsmethode hinterlegt" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setTab("payment-methods")}
                      aria-label="Zum Tab Zahlungsarten wechseln, um eine Zahlungsmethode hinzuzufügen"
                      style={{
                        fontSize: "0.85rem",
                        color: "#24c598",
                        fontWeight: 500,
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        textAlign: "left",
                        outlineOffset: "2px",
                      }}
                    >
                      Zahlungsmethode hinzufügen
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.kpiCard} style={kpiCardStyle}>
                <div style={{ fontSize: "0.8rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Offene Beträge</div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: overview.openAmount > 0 ? "#B91C1C" : "#0A0A0A", fontVariantNumeric: "tabular-nums" }}>
                  {formatCents(overview.openAmount, overview.currency)}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: "8px", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#0A0A0A", marginBottom: "1rem", marginTop: 0 }}>Letzte Rechnung</h2>
              {overview.lastInvoice ? (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem 1.25rem" }}>
                  <span style={{ fontWeight: 600, color: "#0A0A0A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }} title={overview.lastInvoice.invoiceNumber}>{overview.lastInvoice.invoiceNumber}</span>
                  <span style={{ fontSize: "0.9rem", color: "#6B7280" }}>
                    {formatDate(overview.lastInvoice.periodStart)} – {formatDate(overview.lastInvoice.periodEnd)}
                  </span>
                  <span style={{ fontWeight: 600, color: "#0A0A0A", fontVariantNumeric: "tabular-nums" }}>{formatCents(overview.lastInvoice.totalAmount, overview.lastInvoice.currency)}</span>
                  <InvoiceStatusBadge status={overview.lastInvoice.status} />
                  {overview.lastInvoice.hasOverage && (
                    <span style={{ fontSize: "0.8rem", backgroundColor: "#E0F2FE", color: "#0369A1", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Enthält Zusatznutzung</span>
                  )}
                  <InvoiceDownloadButton
                    href={`/api/app/organization/billing/invoices/${overview.lastInvoice.id}/pdf`}
                    invoiceNumber={overview.lastInvoice.invoiceNumber}
                    variant="iconAndText"
                  />
                </div>
              ) : (
                <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: 0 }}>Noch keine Rechnungen vorhanden.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Rechnungen */}
        {tab === "invoices" && (
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <label style={{ fontSize: "0.9rem", color: "#6B7280" }}>Jahr:</label>
              <select
                value={invoicesYear}
                onChange={(e) => setInvoicesYear(e.target.value)}
                style={{ padding: "0.5rem 0.75rem", border: "1px solid #E5E5E5", borderRadius: "6px", minWidth: "120px", fontSize: "0.9rem", maxWidth: "100%" }}
              >
                {invoiceYears.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            {invoicesLoading ? (
              <LoadingSpinner message="Rechnungen werden geladen…" />
            ) : invoices.length === 0 ? (
              <p style={{ padding: "1.5rem", color: "#6B7280", textAlign: "center", backgroundColor: "#F9FAFB", borderRadius: "8px", margin: 0 }}>
                Für den gewählten Zeitraum liegen keine Rechnungen vor.
              </p>
            ) : isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, color: "#0A0A0A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }} title={inv.invoiceNumber}>{inv.invoiceNumber}</span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#6B7280" }}>
                      {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)} · {formatDate(inv.createdAt)}
                    </div>
                    <div style={{ fontSize: "0.9rem", fontVariantNumeric: "tabular-nums" }}>
                      Netto: {formatCents(inv.netAmount, inv.currency)} · MwSt: {formatCents(inv.taxAmount, inv.currency)} · <strong>{formatCents(inv.totalAmount, inv.currency)}</strong>
                    </div>
                    <div>
                      <InvoiceDownloadButton
                        href={inv.pdfUrl || `/api/app/organization/billing/invoices/${inv.id}/pdf`}
                        invoiceNumber={inv.invoiceNumber}
                        variant="iconAndText"
                        disabled={!(inv.pdfUrl || inv.status === "paid")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ width: "100%", border: "1px solid #E5E5E5", borderRadius: "8px", overflow: "hidden" }}>
                <table className={styles.invoicesTable}>
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB", textAlign: "left" }}>
                      <th className={styles.invoiceNumberTh} style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Rechnungsnummer</th>
                      <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Rechnungsdatum</th>
                      <th className={styles.amountTh} style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Nettobetrag</th>
                      <th className={styles.amountTh} style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>MwSt</th>
                      <th className={styles.amountTh} style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Gesamtbetrag</th>
                      <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Status</th>
                      <th style={{ padding: "0.75rem", borderBottom: "1px solid #E5E5E5" }}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                        <td className={styles.invoiceNumberCell} style={{ padding: "0.75rem", fontWeight: 500 }} title={inv.invoiceNumber}>{inv.invoiceNumber}</td>
                        <td style={{ padding: "0.75rem", color: "#6B7280" }}>{formatDate(inv.createdAt)}</td>
                        <td className={styles.amountCell} style={{ padding: "0.75rem" }}>{formatCents(inv.netAmount, inv.currency)}</td>
                        <td className={styles.amountCell} style={{ padding: "0.75rem" }}>{formatCents(inv.taxAmount, inv.currency)}</td>
                        <td className={styles.amountCell} style={{ padding: "0.75rem", fontWeight: 600 }}>{formatCents(inv.totalAmount, inv.currency)}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <InvoiceDownloadButton
                              href={inv.pdfUrl || `/api/app/organization/billing/invoices/${inv.id}/pdf`}
                              invoiceNumber={inv.invoiceNumber}
                              variant="icon"
                              disabled={!(inv.pdfUrl || inv.status === "paid")}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Rechnungsdaten */}
        {tab === "billing-data" && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: "12px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0A0A0A", marginBottom: "1.5rem", marginTop: 0 }}>Rechnungsdaten</h2>

            {/* Abschnitt 1 – Rechnungs-Kontakt */}
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginTop: 0, marginBottom: "0.75rem" }}>Rechnungs-Kontakt</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <div style={{ minWidth: 0 }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#0A0A0A", fontWeight: 500, fontSize: "0.9rem" }}>Rechnungs-E-Mail</label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="billing@example.com"
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#0A0A0A", fontWeight: 500, fontSize: "0.9rem" }}>Rechnungs-Kontakt (User)</label>
                <select
                  value={billingContactUserId}
                  onChange={(e) => setBillingContactUserId(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
                >
                  <option value="">Keine Auswahl</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Abschnitt 2 – Steuerinformationen */}
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginTop: "0.5rem", marginBottom: "0.75rem" }}>Steuerinformationen</h3>
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#0A0A0A", fontWeight: 500, fontSize: "0.9rem" }}>USt-ID</label>
              <input
                type="text"
                value={vatId}
                onChange={(e) => setVatId(e.target.value)}
                placeholder="z. B. DE123456789"
                style={{ width: "100%", maxWidth: "320px", padding: "0.75rem", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
              />
            </div>

            {/* Abschnitt 3 – Rechnungsadresse */}
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginTop: "0.5rem", marginBottom: "0.75rem" }}>Rechnungsadresse</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ gridColumn: "1 / -1", minWidth: 0 }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#0A0A0A", fontWeight: 500, fontSize: "0.9rem" }}>Straße und Hausnummer</label>
                <input
                  type="text"
                  value={invoiceAddressStreet}
                  onChange={(e) => setInvoiceAddressStreet(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#0A0A0A", fontWeight: 500, fontSize: "0.9rem" }}>Postleitzahl</label>
                <input
                  type="text"
                  value={invoiceAddressZip}
                  onChange={(e) => setInvoiceAddressZip(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#0A0A0A", fontWeight: 500, fontSize: "0.9rem" }}>Stadt</label>
                <input
                  type="text"
                  value={invoiceAddressCity}
                  onChange={(e) => setInvoiceAddressCity(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <CountrySelect id="billingCountry" label="Land" value={billingCountry} onChange={setBillingCountry} />
              </div>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "1.5rem", marginTop: 0 }}>
              Änderungen gelten für zukünftige Rechnungen. Bereits erstellte Rechnungen bleiben unverändert.
            </p>

            <div style={{ paddingTop: "1.5rem", marginTop: "1rem", borderTop: "1px solid #E5E5E5" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: saving ? "#D1D5DB" : "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Wird gespeichert…" : "Speichern"}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Zahlungsarten */}
        {tab === "payment-methods" && <PaymentMethodsTab />}
      </div>
    </div>
  )
}
