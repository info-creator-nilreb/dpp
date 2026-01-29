/**
 * SELECT PLAN PAGE
 * 
 * Shown when user has no subscription (state = 'none').
 * Allows user to:
 * - Start free trial (no credit card)
 * - Choose a paid subscription
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface PricingPlan {
  id: string
  name: string
  slug: string
  description: string | null
  subscriptionModels: Array<{
    id: string
    billingInterval: string
    trialDays: number | null
    prices: Array<{
      amount: number
      currency: string
    }>
  }>
}

type BillingInterval = "monthly" | "yearly"

export default function SelectPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [error, setError] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    async function loadPlans() {
      try {
        const response = await fetch("/api/pricing/plans")
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans || [])
        } else {
          setError("Fehler beim Laden der Tarife")
        }
      } catch (err) {
        console.error("Error loading plans:", err)
        setError("Fehler beim Laden der Tarife")
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Tarife werden geladen..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#DC2626", marginBottom: "1rem" }}>{error}</p>
        <Link
          href="/app/dashboard"
          style={{
            color: "#24c598",
            textDecoration: "none",
            fontWeight: "500"
          }}
        >
          Zurück zum Dashboard →
        </Link>
      </div>
    )
  }

  // Calculate savings for yearly billing
  const calculateSavings = (monthlyPrice: number, yearlyPrice: number): number => {
    if (yearlyPrice === 0 || monthlyPrice === 0) return 0
    const monthlyYearlyTotal = monthlyPrice * 12
    const savings = ((monthlyYearlyTotal - yearlyPrice) / monthlyYearlyTotal) * 100
    return Math.round(savings)
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Wählen Sie einen Tarif
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          maxWidth: "600px",
          margin: "0 auto",
          marginBottom: "3rem"
        }}>
          Starten Sie mit einer kostenlosen Testphase oder wählen Sie direkt einen bezahlten Tarif.
        </p>
      </div>

      {/* Billing Interval Toggle - zentriert über der mittleren Card */}
      <div style={{
        position: "relative",
        marginBottom: "2rem"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          marginBottom: "2rem"
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
                  backgroundColor: billingInterval === "monthly" ? "#24c598" : "transparent",
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
                  backgroundColor: billingInterval === "yearly" ? "#24c598" : "transparent",
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
            {(() => {
              // Calculate max savings across all plans
              let maxSavings = 0
              plans.forEach(plan => {
                const monthlyModel = plan.subscriptionModels.find(m => m.billingInterval === "monthly")
                const yearlyModel = plan.subscriptionModels.find(m => m.billingInterval === "yearly")
                if (monthlyModel && yearlyModel) {
                  const monthlyPrice = monthlyModel.prices[0]?.amount || 0
                  const yearlyPrice = yearlyModel.prices[0]?.amount || 0
                  if (monthlyPrice > 0 && yearlyPrice > 0) {
                    const savings = calculateSavings(monthlyPrice, yearlyPrice)
                    if (savings > maxSavings) {
                      maxSavings = savings
                    }
                  }
                }
              })
              if (maxSavings > 0) {
                return (
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
                    Sparen Sie bis zu {maxSavings}%
                  </span>
                )
              }
              return null
            })()}
          </div>
          
          {/* Spacer für dritte Card */}
          <div></div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "2rem",
        marginBottom: "3rem", // Mehr Abstand vor dem Link
        alignItems: "stretch" // Alle Cards haben gleiche Höhe
      }}>
        {plans.map((plan) => {
          // Find subscription models for selected billing interval
          const selectedIntervalModels = plan.subscriptionModels.filter(m => m.billingInterval === billingInterval)
          const otherIntervalModels = plan.subscriptionModels.filter(m => m.billingInterval !== billingInterval)
          
          // Find trial model for selected interval (prefer selected interval, fallback to any)
          const trialModelForInterval = selectedIntervalModels.find(m => m.trialDays && m.trialDays > 0)
          const trialModel = trialModelForInterval || plan.subscriptionModels.find(m => m.trialDays && m.trialDays > 0)
          
          // Get trial days from the model matching the selected interval
          const trialDays = trialModelForInterval?.trialDays || trialModel?.trialDays || 0
          
          // Find paid model for selected interval (without trial)
          const paidModel = selectedIntervalModels.find(m => (!m.trialDays || m.trialDays === 0) && m.prices.length > 0)
          
          // Find model for price display (use trial model if it has price, otherwise paid model)
          const priceModel = trialModel && trialModel.prices.length > 0 ? trialModel : paidModel
          
          // Get price for selected interval
          const selectedPrice = priceModel?.prices[0]?.amount || 0
          const currency = priceModel?.prices[0]?.currency || "EUR"
          
          // Check if yearly option exists
          const hasYearlyOption = plan.subscriptionModels.some(m => m.billingInterval === "yearly")
          const hasMonthlyOption = plan.subscriptionModels.some(m => m.billingInterval === "monthly")
          
          // Calculate savings if yearly
          let savings = 0
          if (billingInterval === "yearly" && hasMonthlyOption) {
            const monthlyModel = plan.subscriptionModels.find(m => m.billingInterval === "monthly")
            const monthlyPrice = monthlyModel?.prices[0]?.amount || 0
            if (monthlyPrice > 0 && selectedPrice > 0) {
              savings = calculateSavings(monthlyPrice, selectedPrice)
            }
          }

          return (
            <div
              key={plan.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E5E5",
                padding: "2rem",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                marginBottom: "0.5rem", // Verkleinerter Abstand
                height: "100px" // Feste Höhe für Header + 3 Zeilen Description
              }}>
                <h2 style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#0A0A0A",
                  marginBottom: "0.5rem"
                }}>
                  {plan.name}
                </h2>
                {plan.description && (
                  <p style={{
                    color: "#7A7A7A",
                    fontSize: "0.875rem",
                    marginBottom: "1rem"
                  }}>
                    {plan.description}
                  </p>
                )}
                
                {/* Show helper text if plan doesn't support selected interval */}
                {billingInterval === "yearly" && !hasYearlyOption && (
                  <p style={{
                    color: "#7A7A7A",
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    backgroundColor: "#F9F9F9",
                    borderRadius: "4px"
                  }}>
                    Nur monatliche Abrechnung verfügbar
                  </p>
                )}
              </div>

              {/* Price display - Feste Position */}
              {selectedPrice > 0 && (
                <div style={{
                  marginBottom: "1.5rem",
                  marginTop: "1.5rem" // Positioniert am Ende der Card
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    marginBottom: savings > 0 ? "0.25rem" : "0"
                  }}>
                    <span style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      color: "#0A0A0A"
                    }}>
                      {Math.round(selectedPrice / 100)}€
                    </span>
                    <span style={{
                      fontSize: "0.875rem",
                      color: "#7A7A7A",
                      marginLeft: "0.25rem"
                    }}>
                      / {billingInterval === "yearly" ? "Jahr" : "Monat"}
                    </span>
                  </div>
                  {billingInterval === "yearly" && savings > 0 && (
                    <div style={{
                      fontSize: "0.75rem",
                      color: "#7A7A7A",
                      textAlign: "center"
                    }}>
                      {Math.round(selectedPrice / 100 / 12)}€ / Monat
                    </div>
                  )}
                </div>
              )}

              {/* Trial CTA - "7 Tage kostenlos testen" - Feste Position am Ende */}
              {trialModel && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        // Use trial model that matches selected interval if available, otherwise use any trial model
                        const modelToUse = selectedIntervalModels.find(m => m.trialDays && m.trialDays > 0) || trialModel
                        
                        const response = await fetch("/api/subscription/assign", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            subscriptionModelId: modelToUse.id,
                            startTrial: true,
                          }),
                        })

                        if (response.ok) {
                          // Redirect to dashboard after successful trial assignment
                          window.location.href = "/app/dashboard"
                        } else {
                          const data = await response.json()
                          alert(`Fehler: ${data.error || "Testphase konnte nicht gestartet werden"}`)
                        }
                      } catch (error) {
                        console.error("Error starting trial:", error)
                        alert("Fehler beim Starten der Testphase")
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#24c598",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    {trialDays} Tag{trialDays !== 1 ? "e" : ""} kostenlos testen
                  </button>
                  <div style={{ marginTop: "1.5rem" }}>
                    <p style={{
                      fontSize: "0.75rem",
                      color: "#7A7A7A",
                      textAlign: "center",
                      margin: 0,
                      marginBottom: "0.25rem"
                    }}>
                      Keine Kreditkarte erforderlich
                    </p>
                    <p style={{
                      fontSize: "0.75rem",
                      color: "#7A7A7A",
                      textAlign: "center",
                      margin: 0,
                      fontStyle: "italic"
                    }}>
                      Das Abo endet nach der Probezeit automatisch
                    </p>
                  </div>
                </>
              )}

              {/* Paid subscription button - only show if no trial available - Feste Position am Ende */}
              {!trialModel && paidModel && selectedPrice > 0 ? (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/subscription/assign", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          subscriptionModelId: paidModel.id,
                          startTrial: false,
                        }),
                      })

                      if (response.ok) {
                        // Redirect to dashboard after successful subscription assignment
                        window.location.href = "/app/dashboard"
                      } else {
                        const data = await response.json()
                        alert(`Fehler: ${data.error || "Subscription konnte nicht aktiviert werden"}`)
                      }
                    } catch (error) {
                      console.error("Error assigning subscription:", error)
                      alert("Fehler beim Aktivieren der Subscription")
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#FFFFFF",
                    color: "#24c598",
                    border: "2px solid #24c598",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Jetzt abonnieren
                </button>
              ) : billingInterval === "yearly" && !hasYearlyOption ? (
                <div style={{
                  padding: "1rem",
                  backgroundColor: "#F9F9F9",
                  borderRadius: "6px",
                  textAlign: "center"
                }}>
                  <p style={{
                    fontSize: "0.875rem",
                    color: "#7A7A7A",
                    margin: 0
                  }}>
                    Dieser Tarif ist nur monatlich verfügbar
                  </p>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Link unter allen Cards */}
      <div style={{ 
        textAlign: "center",
        marginTop: "3rem",
        width: "100%",
        clear: "both" // Stellt sicher, dass der Link unter dem Grid ist
      }}>
        <Link
          href="/pricing"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "0.875rem"
          }}
        >
          ← Zurück zur Preisübersicht
        </Link>
      </div>
    </div>
  )
}

