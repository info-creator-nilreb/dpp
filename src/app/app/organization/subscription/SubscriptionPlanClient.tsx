"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ChevronDownIcon } from "@/components/editorial/data/SectionIcons"
import {
  SubscriptionStatus,
  getSubscriptionStateLabel,
  getSubscriptionStateBadgeStyle,
  showPlanComparison,
  isCriticalState,
} from "@/lib/subscription-state-machine"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { formatDateDDMMYYYY } from "@/lib/format-date"

interface SubscriptionData {
  id: string
  plan: string
  planName: string | null
  status: string
  subscriptionState: SubscriptionStatus | null
  trialExpiresAt: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  nextBillingDate: string | null
  cancelAtPeriodEnd: boolean
  canceledAt?: string | null
  billingInterval: string | null
  priceSnapshot: { amount: number; currency: string; billingInterval: string } | null
  contractStartDate?: string | null
  cancellationNoticePeriodDays?: number
  cancellationDeadline?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  featureOverrides?: unknown
}

interface Permissions {
  canChangePlan: boolean
  canCancel: boolean
  canEditPayment: boolean
}

interface UsageEntitlement {
  key: string
  label: string
  limit: number | null
  current: number
  remaining: number | null
  unit?: string
}

interface PlanForComparison {
  id: string
  name: string
  slug: string
  entitlements: Array<{ key: string; value: number | null }>
  subscriptionModels: Array<{
    id: string
    billingInterval: string
    price: { amount: number; currency: string } | null
  }>
}

const PRODUCT_KEYS = ["max_published_dpp", "max_storage_gb"]
const TEAM_KEYS = ["max_users", "max_suppliers"]

const SELECT_PLAN_HREF = "/app/select-plan?source=subscription"

/** Microcopy: 999 € pro Jahr (keine technische Schreibweise) */
function formatPrice(amountCents: number, currency: string, interval: "monthly" | "yearly"): string {
  const amount = amountCents / 100
  const value = amount % 1 === 0 ? String(Math.round(amount)) : amount.toFixed(2)
  const suffix = interval === "monthly" ? " pro Monat" : " pro Jahr"
  const sym = currency === "EUR" ? "€" : currency
  return `${value} ${sym}${suffix}`
}

/** Abrechnungsintervall lesbar: Wird jährlich abgerechnet. */
function formatBillingInterval(interval: string | null): string {
  if (!interval) return "—"
  return interval === "yearly" ? "Wird jährlich abgerechnet." : "Wird monatlich abgerechnet."
}

function groupEntitlements(entitlements: UsageEntitlement[]): { group: string; items: UsageEntitlement[] }[] {
  const product: UsageEntitlement[] = []
  const team: UsageEntitlement[] = []
  const other: UsageEntitlement[] = []
  for (const e of entitlements) {
    if (PRODUCT_KEYS.includes(e.key)) product.push(e)
    else if (TEAM_KEYS.includes(e.key)) team.push(e)
    else other.push(e)
  }
  const result: { group: string; items: UsageEntitlement[] }[] = []
  if (product.length) result.push({ group: "Produktressourcen", items: product })
  if (team.length) result.push({ group: "Team & Zugriff", items: team })
  if (other.length) result.push({ group: "Sonstiges", items: other })
  return result
}

export default function SubscriptionPlanClient() {
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [organization, setOrganization] = useState<{
    id: string
    name: string
    vatId?: string | null
    billingEmail?: string | null
    invoiceAddressStreet?: string | null
    invoiceAddressZip?: string | null
    invoiceAddressCity?: string | null
    invoiceAddressCountry?: string | null
  } | null>(null)
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [usageEntitlements, setUsageEntitlements] = useState<UsageEntitlement[]>([])
  const [plans, setPlans] = useState<PlanForComparison[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [openPlanvergleich, setOpenPlanvergleich] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
  const [isSubmittingReactivate, setIsSubmittingReactivate] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setAccessDenied(false)
      try {
        const [subRes, usageRes, plansRes] = await Promise.all([
          fetch("/api/app/organization/subscription", { cache: "no-store" }),
          fetch("/api/app/subscription/usage", { cache: "no-store" }),
          fetch("/api/app/organization/subscription/plans", { cache: "no-store" }),
        ])

        if (subRes.status === 403) {
          setAccessDenied(true)
          setLoading(false)
          return
        }
        if (!subRes.ok) {
          setLoading(false)
          return
        }

        const subData = await subRes.json()
        setSubscription(subData.subscription ?? null)
        setPermissions(subData.permissions ?? { canChangePlan: false, canCancel: false, canEditPayment: false })
        setOrganization(subData.organization ?? null)
        setPaymentMethod(subData.paymentMethod ?? null)
        setIsSuperAdmin(subData.isSuperAdmin === true)

        if (usageRes.ok) {
          const usageData = await usageRes.json()
          setUsageEntitlements(usageData.entitlements ?? [])
        }
        if (plansRes.ok) {
          const plansData = await plansRes.json()
          setPlans(plansData.plans ?? [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Lade Abonnementdaten..." />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div style={{ padding: "clamp(0.75rem, 3vw, 1.5rem) 0 2rem", width: "100%", boxSizing: "border-box" }}>
        <Link
          href="/app/organization"
          style={{ color: "#7A7A7A", textDecoration: "none", fontSize: "0.95rem", marginBottom: "1rem", display: "inline-block" }}
        >
          ← Zurück zur Organisation
        </Link>
        <div style={{ padding: "1.5rem", backgroundColor: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "8px", color: "#92400E" }}>
          Sie haben keine Berechtigung für Abonnement & Plan. Nur Organisations-Administratoren können diesen Bereich einsehen.
        </div>
      </div>
    )
  }

  const state = subscription?.subscriptionState ?? null
  const stateLabel =
    state === SubscriptionStatus.CANCEL_AT_PERIOD_END
      ? "Kündigung aktiv"
      : getSubscriptionStateLabel(state)
  const badgeStyle = getSubscriptionStateBadgeStyle(state)
  const showComparison = showPlanComparison(state)
  const critical = isCriticalState(state)
  const noticePeriodDays = subscription?.cancellationNoticePeriodDays ?? 14
  const accessUntilDate = subscription?.currentPeriodEnd ?? subscription?.nextBillingDate ?? null

  async function handleConfirmCancel() {
    if (!subscription || !permissions?.canCancel || state !== SubscriptionStatus.ACTIVE || isSubmittingCancel) return
    try {
      setIsSubmittingCancel(true)
      const res = await fetch("/api/app/organization/subscription/cancel", {
        method: "POST",
      })
      if (!res.ok) {
        console.error("Kündigung vormerken fehlgeschlagen")
        return
      }
      setSubscription((current) =>
        current
          ? {
              ...current,
              cancelAtPeriodEnd: true,
              subscriptionState: SubscriptionStatus.CANCEL_AT_PERIOD_END,
            }
          : current,
      )
      setShowCancelModal(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  async function handleReactivate() {
    if (!subscription || !permissions?.canCancel || state !== SubscriptionStatus.CANCEL_AT_PERIOD_END || isSubmittingReactivate) {
      return
    }
    try {
      setIsSubmittingReactivate(true)
      const res = await fetch("/api/app/organization/subscription/reactivate", {
        method: "POST",
      })
      if (!res.ok) {
        console.error("Reaktivierung fehlgeschlagen")
        return
      }
      setSubscription((current) =>
        current
          ? {
              ...current,
              cancelAtPeriodEnd: false,
              subscriptionState: SubscriptionStatus.ACTIVE,
            }
          : current,
      )
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingReactivate(false)
    }
  }

  const primaryCardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.75rem 2rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  }
  const secondaryBlockStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem 2rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  }
  const collapsibleTriggerStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    font: "inherit",
    color: "#111827",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    fontSize: "0.9375rem",
    fontWeight: 500,
    textAlign: "left",
  }

  return (
    <div style={{ padding: "clamp(0.75rem, 3vw, 1.5rem) 0 2rem", width: "100%", boxSizing: "border-box" }}>
      <Link
        href="/app/organization"
        style={{ color: "#7A7A7A", textDecoration: "none", fontSize: "0.95rem", marginBottom: "0.75rem", display: "inline-block" }}
      >
        ← Zur Organisation
      </Link>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0A0A0A", marginBottom: "1.5rem" }}>
        Plan
      </h1>

      {critical && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: "8px",
            backgroundColor: state === SubscriptionStatus.PAST_DUE ? "#FEE2E2" : "#F3F4F6",
            border: state === SubscriptionStatus.PAST_DUE ? "1px solid #FCA5A5" : "1px solid #E5E7EB",
            color: state === SubscriptionStatus.PAST_DUE ? "#991B1B" : "#374151",
          }}
        >
          {state === SubscriptionStatus.PAST_DUE && (
            <>Zahlung fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode.</>
          )}
          {state === SubscriptionStatus.EXPIRED && (
            <>Publishing deaktiviert.</>
          )}
        </div>
      )}

      {/* Eine Karte: Status (kontextuell, leicht) → Trennlinie → Plan (primär) */}
      <section style={primaryCardStyle}>
        {/* STATUS – reduziertes Gewicht, Trennlinie nur wenn Plan-Block folgt */}
        <div style={{ paddingBottom: subscription ? "1.25rem" : 0, borderBottom: subscription ? "1px solid #F3F4F6" : "none", marginBottom: subscription ? "1.25rem" : 0 }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#6B7280", margin: "0 0 0.75rem" }}>
            Status
          </h2>
          {!subscription ? (
            <>
              <p style={{ color: "#6B7280", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Kein Abonnement.</p>
              {permissions?.canChangePlan && (
                <Link href={SELECT_PLAN_HREF} style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", borderRadius: "8px", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
                  Plan aktivieren
                </Link>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 500, cursor: "default", ...badgeStyle }}>
                  {stateLabel}
                </span>
              </div>
              {state === SubscriptionStatus.TRIAL && subscription.trialExpiresAt && (
                <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.75rem" }}>
                  Endet am {formatDateDDMMYYYY(subscription.trialExpiresAt)}
                </p>
              )}
              {state === SubscriptionStatus.CANCEL_AT_PERIOD_END && subscription.currentPeriodEnd && (
                <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.75rem" }}>
                  Vertrag endet am {formatDateDDMMYYYY(subscription.currentPeriodEnd)}
                </p>
              )}
              {state === SubscriptionStatus.CANCEL_AT_PERIOD_END && permissions?.canCancel && (
                <button type="button" onClick={handleReactivate} disabled={isSubmittingReactivate} style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600, cursor: isSubmittingReactivate ? "default" : "pointer", opacity: isSubmittingReactivate ? 0.8 : 1 }}>
                  {isSubmittingReactivate ? "Wird reaktiviert…" : "Reaktivieren"}
                </button>
              )}
              {state === SubscriptionStatus.TRIAL && permissions?.canChangePlan && (
                <Link href={SELECT_PLAN_HREF} style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", borderRadius: "8px", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
                  Jetzt kostenpflichtig aktivieren
                </Link>
              )}
              {state === SubscriptionStatus.PAST_DUE && permissions?.canEditPayment && (
                <Link href="/app/organization/billing" style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", borderRadius: "8px", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
                  Zahlungsmethode aktualisieren
                </Link>
              )}
              {state === SubscriptionStatus.CANCELED && (
                <Link href={SELECT_PLAN_HREF} style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", borderRadius: "8px", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
                  Plan aktivieren
                </Link>
              )}
              {state === SubscriptionStatus.EXPIRED && (
                <Link href={SELECT_PLAN_HREF} style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", borderRadius: "8px", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
                  Plan aktivieren
                </Link>
              )}
              {state === SubscriptionStatus.ACTIVE && permissions?.canEditPayment && (
                <Link href="/app/organization/billing" style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", border: "1px solid #D1D5DB", backgroundColor: "#fff", color: "#111827", borderRadius: "8px", fontSize: "0.875rem", textDecoration: "none", fontWeight: 500 }}>
                  Zahlungsmethode ändern
                </Link>
              )}
            </>
          )}
        </div>

        {/* PLAN – Tarif, Preis, Intervall, Plan wechseln */}
        {subscription && (
          <>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0A0A0A", margin: "0 0 0.5rem" }}>
              Aktueller Tarif
            </h2>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
              {subscription.planName || subscription.plan}
            </div>
            {subscription.priceSnapshot && (
              <>
                <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#0A0A0A", letterSpacing: "-0.02em", marginBottom: "0.125rem" }}>
                  {formatPrice(subscription.priceSnapshot.amount, subscription.priceSnapshot.currency, (subscription.billingInterval as "monthly" | "yearly") || "monthly")}
                </div>
                <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: "0 0 1rem", fontWeight: 400 }}>
                  {formatBillingInterval(subscription.billingInterval)}
                </p>
              </>
            )}
            {permissions?.canChangePlan && showComparison && (
              <Link
                href={SELECT_PLAN_HREF}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.5rem 1rem",
                  border: "1px solid #D1D5DB",
                  backgroundColor: "#fff",
                  color: "#111827",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Plan wechseln
              </Link>
            )}
          </>
        )}
      </section>

      {subscription && permissions?.canCancel && state === SubscriptionStatus.ACTIVE && (
        <div style={{ margin: "24px 0" }}>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#B91C1C",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Plan kündigen
          </button>
        </div>
      )}

      {/* 2. SECONDARY BLOCK: Nutzung & Limits */}
      <section style={secondaryBlockStyle}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0A0A0A", marginBottom: "1.25rem", marginTop: 0 }}>
          Nutzung & Limits
        </h2>
        {usageEntitlements.length === 0 ? (
          <p style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Keine Nutzungsdaten vorhanden.</p>
        ) : (
          groupEntitlements(usageEntitlements).map(({ group, items }, groupIndex) => (
            <div key={group} style={{ marginBottom: groupIndex < groupEntitlements(usageEntitlements).length - 1 ? "40px" : 0 }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "24px", marginTop: 0 }}>
                {group}
              </h3>
              {items.map((e, index) => {
                const limit = e.limit ?? 0
                const pct = limit > 0 ? Math.min(100, Math.round((e.current / limit) * 100)) : 0
                const atLimit = limit > 0 && e.current >= limit
                const warn = limit > 0 && pct >= 80 && !atLimit
                const unitSuffix = e.unit && e.unit !== "count" ? ` ${e.unit}` : ""
                const usageLine = e.limit != null
                  ? `${e.current} von ${e.limit}${unitSuffix} genutzt`
                  : "Unbegrenzt verfügbar"
                return (
                  <div
                    key={e.key}
                    style={{
                      marginBottom: index < items.length - 1 ? "24px" : 0,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#0A0A0A", fontSize: "0.9375rem", marginBottom: "4px" }}>
                      {e.label}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: e.limit != null ? "8px" : 0 }}>
                      {usageLine}
                    </div>
                    {e.limit != null ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: atLimit ? "8px" : 0 }}>
                          <div style={{ flex: 1, height: "8px", backgroundColor: "#E5E7EB", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                backgroundColor: atLimit ? "#DC2626" : warn ? "#F59E0B" : "#24c598",
                                borderRadius: "4px",
                                transition: "width 0.2s ease",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.8125rem", color: "#6B7280", minWidth: "36px", textAlign: "right" }}>
                            {pct} %
                          </span>
                        </div>
                        {atLimit && (
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <span style={{ fontSize: "0.8125rem", color: "#B91C1C" }}>
                              Limit erreicht. Upgrade erforderlich.
                            </span>
                            <Link
                              href={SELECT_PLAN_HREF}
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.625rem",
                                backgroundColor: "#24c598",
                                color: "#fff",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                textDecoration: "none",
                                fontWeight: 500,
                              }}
                            >
                              Plan upgraden
                            </Link>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </section>

      {/* 3. COLLAPSIBLE: Planoptionen vergleichen – collapsed by default, minimal table */}
      {showComparison && plans.length > 0 && (
        <section style={{ margin: "24px 0" }}>
          <button
            type="button"
            onClick={() => setOpenPlanvergleich((v) => !v)}
            style={collapsibleTriggerStyle}
            aria-expanded={openPlanvergleich}
          >
            <span>Planoptionen vergleichen</span>
            <span
              style={{
                transform: openPlanvergleich ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.18s ease-out",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <ChevronDownIcon size={14} color="#9CA3AF" />
            </span>
          </button>
          <div
            style={{
              overflow: "hidden",
              maxHeight: openPlanvergleich ? "800px" : "0",
              transition: "max-height 0.2s ease-out",
            }}
          >
            <div style={{ paddingTop: "16px" }}>
              {(() => {
                const currentUsageByKey: Record<string, number> = {}
                usageEntitlements.forEach((e) => { currentUsageByKey[e.key] = e.current })
                const downgradeExceedsUsage = (planSlug: string): boolean => {
                  if (planSlug === subscription?.plan) return false
                  const plan = plans.find((p) => p.slug === planSlug)
                  if (!plan) return false
                  for (const ent of plan.entitlements) {
                    const limit = ent.value
                    if (limit == null) continue
                    const current = currentUsageByKey[ent.key] ?? 0
                    if (current > limit) return true
                  }
                  return false
                }
                const anyDowngradeWarning = plans.some((p) => p.slug !== subscription?.plan && downgradeExceedsUsage(p.slug))
                return (
                  <>
                    {anyDowngradeWarning && (
                      <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", backgroundColor: "#FEF3C7", borderRadius: "8px", fontSize: "0.875rem", color: "#92400E" }}>
                        Ihre aktuelle Nutzung überschreitet die Limits mancher Pläne. Bitte reduzieren Sie die Nutzung vor einem Downgrade.
                      </div>
                    )}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                            <th style={{ padding: "0.5rem 0.5rem 0.5rem 0", textAlign: "left", color: "#6B7280", fontWeight: 500 }}>Feature</th>
                            {plans.map((p) => (
                              <th key={p.id} style={{ padding: "0.5rem", textAlign: "center", fontWeight: 600, color: subscription?.plan === p.slug ? "#24c598" : "#0A0A0A" }}>
                                {p.name}
                                {subscription?.plan === p.slug && (
                                  <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "#24c598" }}>Aktuell</span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const allKeys = new Set<string>()
                            plans.forEach((plan) => plan.entitlements.forEach((e) => allKeys.add(e.key)))
                            const keys = Array.from(allKeys).slice(0, 5)
                            if (keys.length === 0) return null
                            return keys.map((key) => (
                              <tr key={key} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                <td style={{ padding: "0.5rem 0.5rem 0.5rem 0", color: "#374151" }}>{getEntitlementDefinition(key).label}</td>
                                {plans.map((plan) => {
                                  const ent = plan.entitlements.find((e) => e.key === key)
                                  const val = ent?.value
                                  const display = val == null ? "Unbegrenzt" : String(val)
                                  const isCurrent = subscription?.plan === plan.slug
                                  return (
                                    <td key={plan.id} style={{ padding: "0.5rem", textAlign: "center", backgroundColor: isCurrent ? "rgba(36,197,152,0.06)" : "transparent" }}>
                                      {display}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {permissions?.canChangePlan && (
                      <div style={{ marginTop: "1rem" }}>
                        <button
                          type="button"
                          onClick={() => setShowPlanChangeModal(true)}
                          style={{ padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}
                        >
                          Plan wechseln
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Bestätigungsmodal Planwechsel */}
      {showPlanChangeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowPlanChangeModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "1.5rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem" }}>Plan wechseln</h3>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.75rem" }}>
              Sie werden zur Tarifauswahl weitergeleitet. Neuer Preis und Wirksamkeitsdatum werden dort angezeigt. Bei Wechsel in der laufenden Periode kann eine anteilige Abrechnung (Proration) erfolgen.
            </p>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "1rem" }}>
              Bei Downgrade unter Ihre aktuelle Nutzung bitten wir Sie, zuerst die Nutzung zu reduzieren.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowPlanChangeModal(false)}
                style={{ padding: "0.5rem 1rem", border: "1px solid #D1D5DB", borderRadius: "6px", background: "#fff", cursor: "pointer" }}
              >
                Abbrechen
              </button>
              <Link
                href={SELECT_PLAN_HREF}
                style={{ display: "inline-block", padding: "0.5rem 1rem", backgroundColor: "#24c598", color: "#fff", borderRadius: "6px", fontSize: "0.875rem", textDecoration: "none" }}
              >
                Plan wechseln
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
