"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { getEntitlementIcon } from "@/components/EntitlementIcons"
import { getFeatureDescription } from "@/lib/pricing/feature-translations"

interface Feature {
  key: string
  name: string
  description: string | null
  category: string
}

interface Entitlement {
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
}

interface PricingPageContentProps {
  pricingPlans: PricingPlan[]
  featureRegistry: Feature[]
  entitlements: Entitlement[]
}

export default function PricingPageContent({
  pricingPlans,
  featureRegistry,
  entitlements
}: PricingPageContentProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [expandedFeatureCategory, setExpandedFeatureCategory] = useState<string | null>(null)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const formatPrice = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency
    }).format(amount / 100)
  }

  // Calculate savings for yearly plans
  const calculateSavings = (plan: PricingPlan): number | null => {
    const monthlyModel = plan.subscriptionModels.find(m => m.billingInterval === "monthly" && m.isActive)
    const yearlyModel = plan.subscriptionModels.find(m => m.billingInterval === "yearly" && m.isActive)
    
    if (!monthlyModel?.prices[0] || !yearlyModel?.prices[0]) return null
    
    const monthlyPrice = monthlyModel.prices[0].amount
    const yearlyPrice = yearlyModel.prices[0].amount
    const monthlyYearly = monthlyPrice * 12
    
    if (yearlyPrice >= monthlyYearly) return null
    
    return Math.round(((monthlyYearly - yearlyPrice) / monthlyYearly) * 100)
  }

  // Get all unique features across all plans for comparison table
  const allFeatureKeys = new Set<string>()
  pricingPlans.forEach(plan => {
    plan.features.forEach(f => allFeatureKeys.add(f.featureKey))
  })

  // Group features by category
  const featuresByCategory = Array.from(allFeatureKeys).reduce((acc, featureKey) => {
    const featureInfo = featureRegistry.find(f => f.key === featureKey)
    const category = featureInfo?.category || "Sonstiges"
    if (!acc[category]) acc[category] = []
    acc[category].push(featureKey)
    return acc
  }, {} as Record<string, string[]>)

  // Get all unique entitlements across all plans
  const allEntitlementKeys = new Set<string>()
  pricingPlans.forEach(plan => {
    plan.entitlements.forEach(e => allEntitlementKeys.add(e.entitlementKey))
  })

  // Determine highlighted plan (first plan or plan with highest display order)
  const highlightedPlanId = pricingPlans.length > 0 
    ? pricingPlans.reduce((prev, current) => 
        (current.displayOrder > prev.displayOrder) ? current : prev
      ).id
    : null

  if (pricingPlans.length === 0) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "#F9F9F9"
      }}>
        <div style={{
          textAlign: "center",
          maxWidth: "600px"
        }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "1rem"
          }}>
            Preise
          </h1>
          <p style={{
            color: "#7A7A7A",
            fontSize: "1rem"
          }}>
            Derzeit sind keine Pricing Plans verfügbar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F9F9F9"
    }}>
      {/* Hero Section */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E5E5E5",
        padding: "clamp(3rem, 8vw, 6rem) clamp(1rem, 3vw, 2rem)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center"
        }}>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "1.5rem",
            lineHeight: "1.2"
          }}>
            Einfach. Skalierbar.{" "}
            <span style={{ color: "#E20074" }}>ESPR-ready.</span>
          </h1>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            maxWidth: "700px",
            margin: "0 auto 2rem",
            lineHeight: "1.6"
          }}>
            Wählen Sie den passenden Plan für Ihre Anforderungen. 
            Alle Pläne sind vollständig konfigurierbar und wachsen mit Ihrem Unternehmen.
          </p>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#7A7A7A",
              fontSize: "0.875rem"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>DSGVO-konform</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#7A7A7A",
              fontSize: "0.875rem"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>EU-Datenhosting</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#7A7A7A",
              fontSize: "0.875rem"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Kostenlos testen</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)"
      }}>
        {/* Billing Interval Toggle - zentriert über der mittleren Card */}
        <div style={{
          position: "relative",
          marginBottom: "2rem"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
            width: "100%",
            boxSizing: "border-box"
          }}>
            {/* Spacer für erste Card */}
            <div></div>
            
            {/* Toggle zentriert über mittlerer Card mit Badge */}
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "center",
              alignItems: "center",
              gap: isMobile ? "0.75rem" : "0",
              marginTop: "-1rem",
              marginBottom: "-1rem",
              position: "relative",
              zIndex: 1
            }}>
              {/* Toggle - zentriert */}
              <div style={{
                display: "flex",
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                padding: "0.25rem",
                border: "1px solid #E5E5E5",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}>
                <button
                  onClick={() => setBillingInterval("monthly")}
                  style={{
                    padding: "0.625rem 1.5rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: billingInterval === "monthly" ? "#E20074" : "transparent",
                    color: billingInterval === "monthly" ? "#FFFFFF" : "#0A0A0A",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Monatlich
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  style={{
                    padding: "0.625rem 1.5rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: billingInterval === "yearly" ? "#E20074" : "transparent",
                    color: billingInterval === "yearly" ? "#FFFFFF" : "#0A0A0A",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Jährlich
                </button>
              </div>
              {/* Badge - unter Toggle auf Mobile, rechts auf Desktop */}
              {pricingPlans.some(plan => calculateSavings(plan) !== null) && (
                <span style={{
                  position: isMobile ? "relative" : "absolute",
                  left: isMobile ? "auto" : "calc(50% + 120px)",
                  backgroundColor: "#22C55E",
                  color: "#FFFFFF",
                  fontSize: "0.625rem",
                  fontWeight: "600",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "12px",
                  whiteSpace: "nowrap",
                  lineHeight: "1.2"
                }}>
                  Sparen Sie bis zu {Math.max(...pricingPlans.map(plan => calculateSavings(plan) || 0))}%
                </span>
              )}
            </div>
            
            {/* Spacer für dritte Card */}
            <div></div>
          </div>
        </div>

        {/* Pricing Plans Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "4rem",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {pricingPlans.map((plan) => {
            const subscriptionModel = plan.subscriptionModels.find(
              m => m.billingInterval === billingInterval && m.isActive
            )
            const price = subscriptionModel?.prices[0]
            const isHighlighted = plan.id === highlightedPlanId
            const savings = calculateSavings(plan)

            return (
              <div
                key={plan.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "2rem",
                  border: isHighlighted ? "2px solid #E20074" : "1px solid #E5E5E5",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "all 0.2s",
                  boxShadow: isHighlighted ? "0 8px 24px rgba(226, 0, 116, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
                  boxSizing: "border-box",
                  width: "100%",
                  minWidth: 0
                }}
                onMouseEnter={(e) => {
                  if (!isHighlighted) {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isHighlighted) {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)"
                  }
                }}
              >
                {/* Badge */}
                {isHighlighted && (
                  <div style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#E20074",
                    color: "#FFFFFF",
                    padding: "0.375rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}>
                    Beliebtester Plan
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ 
                  marginBottom: "1.5rem",
                  minWidth: 0,
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}>
                  <h2 style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "0.5rem",
                    wordWrap: "break-word",
                    overflowWrap: "break-word"
                  }}>
                    {plan.name}
                  </h2>
                  {plan.descriptionMarketing && (
                    <p style={{
                      color: "#7A7A7A",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      wordWrap: "break-word",
                      overflowWrap: "break-word"
                    }}>
                      {plan.descriptionMarketing}
                    </p>
                  )}
                </div>

                {/* Price */}
                {price ? (
                  <div style={{
                    marginBottom: "1.5rem"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.5rem",
                      marginBottom: "0.25rem"
                    }}>
                      <div style={{
                        fontSize: "2.5rem",
                        fontWeight: "700",
                        color: "#0A0A0A",
                        lineHeight: "1"
                      }}>
                        {formatPrice(price.amount, price.currency)}
                      </div>
                      {billingInterval === "yearly" && savings && savings > 0 && (
                        <span style={{
                          fontSize: "0.75rem",
                          color: "#E20074",
                          fontWeight: "600"
                        }}>
                          ({savings}% gespart)
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: "0.875rem",
                      color: "#7A7A7A"
                    }}>
                      pro {billingInterval === "monthly" ? "Monat" : "Jahr"}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "#F9F9F9",
                    borderRadius: "8px",
                    textAlign: "center",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    boxSizing: "border-box",
                    width: "100%"
                  }}>
                    <p style={{
                      color: "#7A7A7A",
                      fontSize: "0.875rem",
                      marginBottom: "0.5rem",
                      wordWrap: "break-word",
                      overflowWrap: "break-word"
                    }}>
                      Individuelles Angebot
                    </p>
                    <Link
                      href="/contact"
                      style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#E20074",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Kontakt aufnehmen
                    </Link>
                  </div>
                )}

                {/* Trial Info */}
                {subscriptionModel && subscriptionModel.trialDays > 0 && (
                  <div style={{
                    padding: "0.75rem",
                    backgroundColor: "#E6F7E6",
                    borderRadius: "6px",
                    marginBottom: "1.5rem",
                    fontSize: "0.875rem",
                    color: "#0A0A0A",
                    textAlign: "center",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    boxSizing: "border-box",
                    width: "100%"
                  }}>
                    <strong>{subscriptionModel.trialDays} Tage</strong> kostenlos testen
                  </div>
                )}

                {/* Key Limits */}
                {plan.entitlements.length > 0 && (
                  <div style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "#F9F9F9",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    width: "100%",
                    minWidth: 0
                  }}>
                    <h3 style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#0A0A0A",
                      marginBottom: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      wordWrap: "break-word",
                      overflowWrap: "break-word"
                    }}>
                      Wichtige Limits
                    </h3>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}>
                      {plan.entitlements.slice(0, 3).map((entitlement) => {
                        const definition = getEntitlementDefinition(entitlement.entitlementKey)
                        const icon = getEntitlementIcon(definition.icon, 18, "#E20074")
                        return (
                          <div
                            key={entitlement.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              minWidth: 0
                            }}
                          >
                            {icon && (
                              <div style={{ flexShrink: 0 }}>
                                {icon}
                              </div>
                            )}
                            <div style={{ 
                              flex: 1,
                              minWidth: 0,
                              wordWrap: "break-word",
                              overflowWrap: "break-word"
                            }}>
                              <div style={{
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                color: "#0A0A0A",
                                wordWrap: "break-word",
                                overflowWrap: "break-word"
                              }}>
                                {entitlement.value === null ? (
                                  <span style={{ color: "#E20074" }}>Unbegrenzt</span>
                                ) : (
                                  <>
                                    Bis zu {entitlement.value}
                                    {definition.unit && definition.unit !== "count" && (
                                      <span style={{
                                        marginLeft: "0.25rem",
                                        color: "#7A7A7A",
                                        fontWeight: "400"
                                      }}>
                                        {definition.unit}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <div style={{
                                fontSize: "0.75rem",
                                color: "#7A7A7A",
                                wordWrap: "break-word",
                                overflowWrap: "break-word"
                              }}>
                                {definition.label}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                {price ? (
                  <Link
                    href={`/signup?plan=${plan.slug}`}
                    style={{
                      display: "block",
                      padding: "0.875rem 1.5rem",
                      backgroundColor: isHighlighted ? "#E20074" : "#0A0A0A",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      transition: "background-color 0.2s",
                      marginTop: "auto"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#C1005F"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isHighlighted ? "#E20074" : "#0A0A0A"
                    }}
                  >
                    Jetzt starten
                  </Link>
                ) : (
                  <Link
                    href="/contact"
                    style={{
                      display: "block",
                      padding: "0.875rem 1.5rem",
                      backgroundColor: "#0A0A0A",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      transition: "background-color 0.2s",
                      marginTop: "auto"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#333333"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0A0A0A"
                    }}
                  >
                    Kontakt aufnehmen
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        {allFeatureKeys.size > 0 && (
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "2rem",
            border: "1px solid #E5E5E5",
            marginBottom: "3rem",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden"
          }}>
            <h2 style={{
              fontSize: "1.75rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "2rem",
              textAlign: "center"
            }}>
              Feature-Vergleich
            </h2>

            {/* Desktop: Table */}
            {!isMobile && (
              <div>
                <div style={{ 
                overflowX: "auto",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "auto",
                  minWidth: "600px"
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        textAlign: "left",
                        padding: "1rem",
                        borderBottom: "2px solid #E5E5E5",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#0A0A0A",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        minWidth: "200px"
                      }}>
                        Feature
                      </th>
                      {pricingPlans.map(plan => (
                        <th
                          key={plan.id}
                          style={{
                            textAlign: "center",
                            padding: "1rem",
                            borderBottom: "2px solid #E5E5E5",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#0A0A0A",
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            minWidth: "120px"
                          }}
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(featuresByCategory).map(([category, featureKeys]) => (
                      <React.Fragment key={category}>
                        <tr>
                          <td
                            colSpan={pricingPlans.length + 1}
                            style={{
                              padding: "1rem 0.75rem 0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              color: "#7A7A7A",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em"
                            }}
                          >
                            {category}
                          </td>
                        </tr>
                        {featureKeys.map(featureKey => {
                          const featureInfo = featureRegistry.find(f => f.key === featureKey)
                          const description = getFeatureDescription(featureKey, featureInfo?.description || null)
                          return (
                            <tr
                              key={featureKey}
                              onMouseEnter={() => setHoveredFeature(featureKey)}
                              onMouseLeave={() => setHoveredFeature(null)}
                              style={{
                                backgroundColor: hoveredFeature === featureKey ? "#F9F9F9" : "transparent",
                                transition: "background-color 0.2s"
                              }}
                            >
                              <td style={{
                                padding: "0.75rem",
                                borderBottom: "1px solid #F5F5F5",
                                fontSize: "0.875rem",
                                color: "#0A0A0A",
                                position: "relative",
                                wordWrap: "break-word",
                                overflowWrap: "break-word",
                                maxWidth: "300px"
                              }}>
                                <div style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: "0.5rem",
                                  minWidth: 0,
                                  flexWrap: "wrap"
                                }}>
                                  <span style={{
                                    wordWrap: "break-word",
                                    overflowWrap: "break-word",
                                    flex: "1 1 auto",
                                    minWidth: 0
                                  }}>
                                    {featureInfo?.name || featureKey}
                                  </span>
                                  {description && (
                                    <div style={{
                                      position: "relative",
                                      display: "inline-block"
                                    }}>
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#7A7A7A"
                                        strokeWidth="2"
                                        style={{ cursor: "help" }}
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                      </svg>
                                      {hoveredFeature === featureKey && (
                                        <div style={{
                                          position: "absolute",
                                          bottom: "100%",
                                          left: "50%",
                                          transform: "translateX(-50%)",
                                          marginBottom: "0.5rem",
                                          padding: "0.5rem 0.75rem",
                                          backgroundColor: "#0A0A0A",
                                          color: "#FFFFFF",
                                          borderRadius: "6px",
                                          fontSize: "0.75rem",
                                          lineHeight: "1.5",
                                          whiteSpace: "normal",
                                          wordWrap: "break-word",
                                          overflowWrap: "break-word",
                                          textAlign: "left",
                                          zIndex: 10,
                                          maxWidth: "280px",
                                          minWidth: "150px",
                                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                                        }}>
                                          {description}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              {pricingPlans.map(plan => {
                                const hasFeature = plan.features.some(f => f.featureKey === featureKey && f.included)
                                return (
                                  <td
                                    key={plan.id}
                                    style={{
                                      textAlign: "center",
                                      padding: "0.75rem",
                                      borderBottom: "1px solid #F5F5F5",
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word"
                                    }}
                                  >
                                    {hasFeature ? (
                                      <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#E20074"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ margin: "0 auto" }}
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    ) : (
                                      <span style={{ color: "#E5E5E5" }}>—</span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            )}

            {/* Mobile: Accordions */}
            {isMobile && (
              <div>
                {Object.entries(featuresByCategory).map(([category, featureKeys]) => (
                <div key={category} style={{ marginBottom: "1rem" }}>
                  <button
                    onClick={() => setExpandedFeatureCategory(
                      expandedFeatureCategory === category ? null : category
                    )}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      backgroundColor: "#F9F9F9",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#0A0A0A",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{category}</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: expandedFeatureCategory === category ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s"
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expandedFeatureCategory === category && (
                    <div style={{
                      marginTop: "0.5rem",
                      padding: "1rem",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px"
                    }}>
                      {featureKeys.map(featureKey => {
                        const featureInfo = featureRegistry.find(f => f.key === featureKey)
                        const description = getFeatureDescription(featureKey, featureInfo?.description || null)
                        return (
                          <div
                            key={featureKey}
                            style={{
                              padding: "0.75rem 0",
                              borderBottom: "1px solid #F5F5F5"
                            }}
                          >
                            <div style={{
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              color: "#0A0A0A",
                              marginBottom: "0.5rem"
                            }}>
                              {featureInfo?.name || featureKey}
                            </div>
                            {description && (
                              <div style={{
                                fontSize: "0.75rem",
                                color: "#7A7A7A",
                                marginBottom: "0.5rem"
                              }}>
                                {description}
                              </div>
                            )}
                            <div style={{
                              display: "flex",
                              gap: "1rem",
                              flexWrap: "wrap"
                            }}>
                              {pricingPlans.map(plan => {
                                const hasFeature = plan.features.some(f => f.featureKey === featureKey && f.included)
                                return (
                                  <div
                                    key={plan.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    <span style={{ color: "#7A7A7A" }}>{plan.name}:</span>
                                    {hasFeature ? (
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#E20074"
                                        strokeWidth="2"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    ) : (
                                      <span style={{ color: "#E5E5E5" }}>—</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {/* VAT Disclaimer */}
        <div style={{
          textAlign: "center",
          padding: "2rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E5E5"
        }}>
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A",
            lineHeight: "1.6",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. 
            Die Abrechnung erfolgt je nach gewähltem Abrechnungsintervall (monatlich oder jährlich). 
            Sie können jederzeit kündigen.
          </p>
        </div>
      </div>
    </div>
  )
}
