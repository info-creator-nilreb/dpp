"use client"

import { useState } from "react"
import Link from "next/link"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { getEntitlementIcon } from "@/components/EntitlementIcons"

interface Feature {
  key: string
  name: string
  description: string | null
  category: string
}

interface Entitlement {
  id: string
  key: string
  type: string
  unit: string | null
}

interface PricingPlanFeature {
  id: string
  pricingPlanId: string
  featureKey: string
  included: boolean
  note: string | null
}

interface PricingPlanEntitlement {
  id: string
  pricingPlanId: string
  entitlementKey: string
  value: number | null
}

interface Price {
  id: string
  subscriptionModelId: string
  amount: number
  currency: string
  validFrom: string
  validTo: string | null
  isActive: boolean
  createdAt: string
}

interface SubscriptionModel {
  id: string
  pricingPlanId: string
  billingInterval: string
  minCommitmentMonths: number | null
  trialDays: number
  isActive: boolean
  stripePriceId: string | null
  createdAt: string
  updatedAt: string
  prices: Price[]
}

interface PricingPlan {
  id: string
  name: string
  slug: string
  descriptionMarketing: string | null
  isPublic: boolean
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  features: PricingPlanFeature[]
  entitlements: PricingPlanEntitlement[]
  subscriptionModels: SubscriptionModel[]
  _count: {
    subscriptionModels: number
    features: number
    entitlements: number
  }
}

interface PricingManagementContentProps {
  pricingPlans: PricingPlan[]
  availableFeatures: Feature[]
  entitlements: Entitlement[]
}

export default function PricingManagementContent({
  pricingPlans,
  availableFeatures,
  entitlements
}: PricingManagementContentProps) {
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())

  const togglePlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  const formatPrice = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency
    }).format(amount / 100)
  }

  if (pricingPlans.length === 0) {
    return (
      <div style={{
        padding: "3rem",
        textAlign: "center",
        backgroundColor: "#F9F9F9",
        borderRadius: "12px",
        border: "1px solid #E5E5E5"
      }}>
        <p style={{ color: "#7A7A7A", fontSize: "1rem", marginBottom: "1rem" }}>
          Noch keine Pricing Plans vorhanden
        </p>
        <Link
          href="/super-admin/pricing/new"
          style={{
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            padding: "clamp(0.625rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
            fontWeight: "600",
            display: "inline-block",
            whiteSpace: "nowrap",
            transition: "background-color 0.2s"
          }}
        >
          Ersten Pricing Plan erstellen
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {pricingPlans.map((plan) => {
        const isExpanded = expandedPlans.has(plan.id)
        const activePriceMonthly = plan.subscriptionModels
          .find(m => m.billingInterval === "monthly" && m.isActive)
          ?.prices[0]
        const activePriceYearly = plan.subscriptionModels
          .find(m => m.billingInterval === "yearly" && m.isActive)
          ?.prices[0]

        return (
          <div
            key={plan.id}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "12px",
              overflow: "hidden",
              transition: "box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            {/* Plan Header */}
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                borderBottom: isExpanded ? "1px solid #E5E5E5" : "none"
              }}
              onClick={() => togglePlan(plan.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                  <h2 style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    margin: 0
                  }}>
                    {plan.name}
                  </h2>
                  {!plan.isActive && (
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#F5F5F5",
                      color: "#7A7A7A",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "500"
                    }}>
                      Inaktiv
                    </span>
                  )}
                  {!plan.isPublic && (
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#FFF4E6",
                      color: "#B45309",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "500"
                    }}>
                      Nicht öffentlich
                    </span>
                  )}
                </div>
                {plan.descriptionMarketing && (
                  <p style={{
                    color: "#7A7A7A",
                    fontSize: "0.9rem",
                    margin: "0.25rem 0 0 0"
                  }}>
                    {plan.descriptionMarketing}
                  </p>
                )}
                <div style={{
                  display: "flex",
                  gap: "1.5rem",
                  marginTop: "0.75rem",
                  fontSize: "0.875rem",
                  color: "#7A7A7A"
                }}>
                  <span>
                    <strong style={{ color: "#0A0A0A" }}>{plan._count.features}</strong> Features
                  </span>
                  <span>
                    <strong style={{ color: "#0A0A0A" }}>{plan._count.entitlements}</strong> Limits
                  </span>
                  <span>
                    <strong style={{ color: "#0A0A0A" }}>{plan._count.subscriptionModels}</strong> Abo-Modelle
                  </span>
                </div>
                {(activePriceMonthly || activePriceYearly) && (
                  <div style={{
                    display: "flex",
                    gap: "1rem",
                    marginTop: "0.75rem",
                    fontSize: "0.875rem"
                  }}>
                    {activePriceMonthly && (
                      <span style={{ color: "#0A0A0A" }}>
                        <strong>{formatPrice(activePriceMonthly.amount, activePriceMonthly.currency)}</strong>
                        <span style={{ color: "#7A7A7A", marginLeft: "0.25rem" }}>/Monat</span>
                      </span>
                    )}
                    {activePriceYearly && (
                      <span style={{ color: "#0A0A0A" }}>
                        <strong>{formatPrice(activePriceYearly.amount, activePriceYearly.currency)}</strong>
                        <span style={{ color: "#7A7A7A", marginLeft: "0.25rem" }}>/Jahr</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Link
                  href={`/super-admin/pricing/${plan.id}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#24c598",
                    color: "#FFFFFF",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#C1005F"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#24c598"
                  }}
                >
                  Bearbeiten
                </Link>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    color: "#7A7A7A",
                    cursor: "pointer"
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div style={{
                padding: "1.5rem",
                backgroundColor: "#F9F9F9",
                borderTop: "1px solid #E5E5E5"
              }}>
                {/* Features */}
                {plan.features.length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#0A0A0A",
                      marginBottom: "0.75rem"
                    }}>
                      Features ({plan.features.length})
                    </h3>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "0.75rem"
                    }}>
                      {plan.features.map((feature) => {
                        const featureInfo = availableFeatures.find(f => f.key === feature.featureKey)
                        return (
                          <div
                            key={feature.id}
                            style={{
                              padding: "0.75rem",
                              backgroundColor: feature.included ? "#E6F7E6" : "#F5F5F5",
                              borderRadius: "6px",
                              border: `1px solid ${feature.included ? "#B8E6B8" : "#E5E5E5"}`
                            }}
                          >
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.25rem"
                            }}>
                              {feature.included ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              )}
                              <span style={{
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                color: "#0A0A0A"
                              }}>
                                {featureInfo?.name || feature.featureKey}
                              </span>
                            </div>
                            {feature.note && (
                              <p style={{
                                fontSize: "0.75rem",
                                color: "#7A7A7A",
                                margin: "0.25rem 0 0 0",
                                fontStyle: "italic"
                              }}>
                                {feature.note}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Entitlements */}
                {plan.entitlements.length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#0A0A0A",
                      marginBottom: "0.75rem"
                    }}>
                      Limits ({plan.entitlements.length})
                    </h3>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "0.75rem"
                    }}>
                      {plan.entitlements.map((entitlement) => {
                        const definition = getEntitlementDefinition(entitlement.entitlementKey)
                        const icon = getEntitlementIcon(definition.icon, 16, "#7A7A7A")
                        return (
                          <div
                            key={entitlement.id}
                            style={{
                              padding: "0.75rem",
                              backgroundColor: "#FFFFFF",
                              borderRadius: "6px",
                              border: "1px solid #E5E5E5"
                            }}
                          >
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.25rem"
                            }}>
                              {icon && (
                                <div style={{ color: "#7A7A7A" }}>
                                  {icon}
                                </div>
                              )}
                              <div style={{
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                color: "#0A0A0A"
                              }}>
                                {definition.label}
                              </div>
                            </div>
                            <div style={{
                              fontSize: "1.25rem",
                              fontWeight: "600",
                              color: "#24c598"
                            }}>
                              {entitlement.value === null ? "Unbegrenzt" : entitlement.value}
                              {definition.unit && definition.unit !== "count" && entitlement.value !== null && (
                                <span style={{
                                  fontSize: "0.75rem",
                                  color: "#7A7A7A",
                                  marginLeft: "0.25rem",
                                  fontWeight: "400"
                                }}>
                                  {definition.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Subscription Models */}
                {plan.subscriptionModels.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#0A0A0A",
                      marginBottom: "0.75rem"
                    }}>
                      Abo-Modelle ({plan.subscriptionModels.length})
                    </h3>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}>
                      {plan.subscriptionModels.map((model) => (
                        <div
                          key={model.id}
                          style={{
                            padding: "1rem",
                            backgroundColor: "#FFFFFF",
                            borderRadius: "6px",
                            border: "1px solid #E5E5E5"
                          }}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem"
                          }}>
                            <div>
                              <span style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#0A0A0A",
                                textTransform: "capitalize"
                              }}>
                                {model.billingInterval === "monthly" ? "Monatlich" : "Jährlich"}
                              </span>
                              {!model.isActive && (
                                <span style={{
                                  marginLeft: "0.5rem",
                                  padding: "0.25rem 0.5rem",
                                  backgroundColor: "#F5F5F5",
                                  color: "#7A7A7A",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem"
                                }}>
                                  Inaktiv
                                </span>
                              )}
                            </div>
                            {model.prices[0] && (
                              <div style={{
                                fontSize: "1.25rem",
                                fontWeight: "600",
                                color: "#0A0A0A"
                              }}>
                                {formatPrice(model.prices[0].amount, model.prices[0].currency)}
                              </div>
                            )}
                          </div>
                          <div style={{
                            display: "flex",
                            gap: "1rem",
                            fontSize: "0.75rem",
                            color: "#7A7A7A"
                          }}>
                            {model.trialDays > 0 && (
                              <span>{model.trialDays} Tage Trial</span>
                            )}
                            {model.minCommitmentMonths && (
                              <span>Mindestlaufzeit: {model.minCommitmentMonths} Monate</span>
                            )}
                            {model.stripePriceId && (
                              <span>Stripe: {model.stripePriceId.substring(0, 20)}...</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

