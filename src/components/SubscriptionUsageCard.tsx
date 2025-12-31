/**
 * Subscription Usage Card
 * 
 * Displays current subscription, usage indicators, and limits
 * Shows warnings at thresholds
 */

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import TrialBanner from "./TrialBanner"
import { LoadingSpinner } from "./LoadingSpinner"
import { getSubscriptionStatusLabel } from "@/lib/subscription-status-labels"

export interface SubscriptionStatus {
  subscriptionState: "no_subscription" | "trial_subscription" | "active_subscription" | "expired_or_suspended"
  trialEndDate: string | null
  canPublish: boolean
  subscription: {
    id: string
    status: string
    pricingPlan?: {
      name: string
      slug: string
    }
    subscriptionModel?: {
      billingInterval: string
      trialDays: number | null
    }
    priceSnapshot?: {
      amount: number
      currency: string
    }
    trialStartedAt: string | null
    trialExpiresAt: string | null
  } | null
}

export interface UsageData {
  organizationId?: string
  subscription?: {
    status: string
    pricingPlan?: {
      name: string
      slug: string
    }
    subscriptionModel?: {
      billingInterval: string
    }
    priceSnapshot?: {
      amount: number
      currency: string
    }
  }
  entitlements: Array<{
    key: string
    label: string
    limit: number | null
    current: number
    remaining: number | null
    unit?: string
  }>
}

export interface SubscriptionUsageCardProps {
  statusData?: SubscriptionStatus | null
  usageData?: UsageData | null
  onLoadComplete?: () => void
}

export default function SubscriptionUsageCard({ 
  statusData: externalStatusData, 
  usageData: externalUsageData,
  onLoadComplete 
}: SubscriptionUsageCardProps) {
  const [statusData, setStatusData] = useState<SubscriptionStatus | null>(externalStatusData || null)
  const [usageData, setUsageData] = useState<UsageData | null>(externalUsageData || null)
  const [loading, setLoading] = useState(!externalStatusData || !externalUsageData)

  useEffect(() => {
    // If data is provided externally, use it and skip loading
    if (externalStatusData && externalUsageData) {
      setStatusData(externalStatusData)
      setUsageData(externalUsageData)
      setLoading(false)
      onLoadComplete?.()
      return
    }

    async function fetchData() {
      try {
        // Fetch both endpoints in parallel for better performance
        const [statusResponse, usageResponse] = await Promise.all([
          fetch("/api/app/subscription/status"),
          fetch("/api/app/subscription/usage")
        ])

        if (statusResponse.ok) {
          const status = await statusResponse.json()
          setStatusData(status)
        }

        if (usageResponse.ok) {
          const usage = await usageResponse.json()
          setUsageData(usage)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
        onLoadComplete?.()
      }
    }

    fetchData()
  }, [externalStatusData, externalUsageData, onLoadComplete])

  if (loading) {
    return (
      <div style={{
        padding: "1.5rem",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E5E5E5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px"
      }}>
        <LoadingSpinner message="Lade Abo-Informationen..." />
      </div>
    )
  }

  if (!statusData || !usageData) {
    return null
  }

  const { subscription: usageSubscription, entitlements } = usageData
  const { subscriptionState, trialEndDate, subscription: statusSubscription } = statusData

  // Determine which subscription data to use (prefer status subscription if available)
  const subscription = statusSubscription || usageSubscription

  return (
    <div style={{
      padding: "1.5rem",
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      border: "1px solid #E5E5E5"
    }}>
      <h2 style={{
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Abo & Limits
      </h2>

      {/* Trial Banner - only show if explicitly in trial */}
      {subscriptionState === "trial_subscription" && usageData.organizationId && trialEndDate && (
        <div style={{ marginBottom: "1.5rem" }}>
          <TrialBanner organizationId={usageData.organizationId} trialEndDate={trialEndDate} />
        </div>
      )}

      {subscriptionState === "no_subscription" ? (
        <div style={{
          padding: "1rem",
          backgroundColor: "#F9F9F9",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "0.875rem", color: "#7A7A7A", marginBottom: "0.5rem" }}>
            Kein aktives Abo
          </p>
          <Link
            href="/pricing"
            style={{
              fontSize: "0.875rem",
              color: "#E20074",
              textDecoration: "none",
              fontWeight: "500"
            }}
          >
            Abo auswählen →
          </Link>
        </div>
      ) : subscription?.pricingPlan ? (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem"
          }}>
            <span style={{ fontSize: "0.875rem", color: "#7A7A7A" }}>Aktueller Plan</span>
            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>
              {subscription.pricingPlan.name}
            </span>
          </div>
          {subscription.priceSnapshot && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem"
            }}>
              <span style={{ fontSize: "0.875rem", color: "#7A7A7A" }}>Preis</span>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>
                {(subscription.priceSnapshot.amount / 100).toFixed(2)} {subscription.priceSnapshot.currency}
                {subscription.subscriptionModel && (
                  <span style={{ color: "#7A7A7A", marginLeft: "0.25rem" }}>
                    / {subscription.subscriptionModel.billingInterval === "monthly" ? "Monat" : "Jahr"}
                  </span>
                )}
              </span>
            </div>
          )}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontSize: "0.875rem", color: "#7A7A7A" }}>Status</span>
            <span style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              backgroundColor: subscription.status === "active" ? "#E6F7E6" : "#FFF4E6",
              color: subscription.status === "active" ? "#2D7A2D" : "#B45309"
            }}>
              {getSubscriptionStatusLabel(subscription.status)}
            </span>
          </div>
        </div>
      ) : null}

      {entitlements.length > 0 && (
        <div>
          <h3 style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.75rem"
          }}>
            Nutzung
          </h3>
          {entitlements.map((entitlement) => {
            // Special handling for published DPPs in trial: Show that publishing is not available
            const isTrial = subscriptionState === "trial_subscription"
            const isPublishedDppLimit = entitlement.key === "max_published_dpp"
            const showTrialPublishingMessage = isTrial && isPublishedDppLimit && !statusData.canPublish
            
            const percentage = entitlement.limit !== null 
              ? Math.min(100, (entitlement.current / entitlement.limit) * 100)
              : 0
            const isWarning = entitlement.limit !== null && percentage >= 80
            const isCritical = entitlement.limit !== null && percentage >= 95

            return (
              <div
                key={entitlement.key}
                style={{
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid #F0F0F0"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem"
                }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
                    {entitlement.label}
                  </span>
                  <span style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: isCritical ? "#DC2626" : isWarning ? "#F59E0B" : "#0A0A0A"
                  }}>
                    {entitlement.current} {entitlement.limit !== null ? `/ ${entitlement.limit}` : ""}
                    {entitlement.unit && entitlement.unit !== "count" && ` ${entitlement.unit}`}
                  </span>
                </div>
                {entitlement.limit !== null && !showTrialPublishingMessage && (
                  <>
                    <div style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "#F0F0F0",
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: isCritical ? "#DC2626" : isWarning ? "#F59E0B" : "#E20074",
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                    {isWarning && (
                      <p style={{
                        fontSize: "0.75rem",
                        color: isCritical ? "#DC2626" : "#F59E0B",
                        marginTop: "0.5rem",
                        marginBottom: 0
                      }}>
                        {isCritical 
                          ? "⚠️ Limit fast erreicht!" 
                          : "⚠️ Limit zu 80% ausgeschöpft"}
                      </p>
                    )}
                  </>
                )}
                {showTrialPublishingMessage && (
                  <span style={{ 
                    fontSize: "0.75rem", 
                    color: "#7A7A7A",
                    fontStyle: "italic"
                  }}>
                    Keine Veröffentlichung in der Testphase möglich
                  </span>
                )}
                {entitlement.limit === null && !showTrialPublishingMessage && (
                  <span style={{ fontSize: "0.75rem", color: "#7A7A7A" }}>Unbegrenzt</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

