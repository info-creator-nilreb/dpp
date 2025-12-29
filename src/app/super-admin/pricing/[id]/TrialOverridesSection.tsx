"use client"

import { useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { getFeatureDescription } from "@/lib/pricing/feature-translations"
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

interface TrialFeatureOverride {
  id: string
  subscriptionModelId: string
  featureKey: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface TrialEntitlementOverride {
  id: string
  subscriptionModelId: string
  entitlementKey: string
  value: number | null
  createdAt: string
  updatedAt: string
}

interface TrialOverridesSectionProps {
  subscriptionModelId: string
  trialFeatureOverrides: TrialFeatureOverride[]
  trialEntitlementOverrides: TrialEntitlementOverride[]
  availableFeatures: Feature[]
  entitlements: Entitlement[]
  onUpdate: () => void
}

export default function TrialOverridesSection({
  subscriptionModelId,
  trialFeatureOverrides,
  trialEntitlementOverrides,
  availableFeatures,
  entitlements,
  onUpdate
}: TrialOverridesSectionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFeatureToggle = async (featureKey: string, enabled: boolean) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch("/api/super-admin/pricing/trial-feature-overrides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscriptionModelId,
          featureKey,
          enabled
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      onUpdate()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const handleEntitlementChange = async (entitlementKey: string, value: number | null) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch("/api/super-admin/pricing/trial-entitlement-overrides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscriptionModelId,
          entitlementKey,
          value: value === null || value === undefined ? null : parseInt(value.toString())
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      onUpdate()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFeatureOverride = async (featureKey: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(
        `/api/super-admin/pricing/trial-feature-overrides?subscriptionModelId=${subscriptionModelId}&featureKey=${featureKey}`,
        {
          method: "DELETE"
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Löschen")
      }

      onUpdate()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveEntitlementOverride = async (entitlementKey: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(
        `/api/super-admin/pricing/trial-entitlement-overrides?subscriptionModelId=${subscriptionModelId}&entitlementKey=${entitlementKey}`,
        {
          method: "DELETE"
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Löschen")
      }

      onUpdate()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const getFeatureOverride = (featureKey: string) => {
    return trialFeatureOverrides.find(o => o.featureKey === featureKey)
  }

  const getEntitlementOverride = (entitlementKey: string) => {
    return trialEntitlementOverrides.find(o => o.entitlementKey === entitlementKey)
  }

  return (
    <div>
      {error && (
        <div style={{
          padding: "0.75rem",
          backgroundColor: "#FEE2E2",
          color: "#DC2626",
          borderRadius: "6px",
          marginBottom: "1rem",
          fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      {/* Trial Feature Overrides */}
      <div style={{ marginBottom: "2rem" }}>
        <h5 style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.75rem"
        }}>
          Features während Trial
        </h5>
        <p style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          marginBottom: "1rem"
        }}>
          Überschreiben Sie die Feature-Verfügbarkeit für die Testphase. Standardmäßig gelten die Features des Pricing Plans.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "0.75rem",
          maxHeight: "300px",
          overflowY: "auto",
          padding: "0.5rem"
        }}>
          {availableFeatures.map((feature) => {
            const override = getFeatureOverride(feature.key)
            return (
              <div
                key={feature.key}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #E5E5E5",
                  borderRadius: "6px",
                  backgroundColor: override ? (override.enabled ? "#F0F9FF" : "#FEE2E2") : "#FFFFFF"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  marginBottom: "0.5rem"
                }}>
                  <input
                    type="checkbox"
                    checked={override ? override.enabled : false}
                    onChange={(e) => {
                      if (override) {
                        if (e.target.checked) {
                          handleFeatureToggle(feature.key, true)
                        } else {
                          handleRemoveFeatureOverride(feature.key)
                        }
                      } else {
                        handleFeatureToggle(feature.key, e.target.checked)
                      }
                    }}
                    disabled={loading}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
                      {feature.name}
                    </div>
                    {feature.description && (
                      <div style={{ fontSize: "0.75rem", color: "#7A7A7A", marginTop: "0.25rem" }}>
                        {getFeatureDescription(feature.key, feature.description)}
                      </div>
                    )}
                  </div>
                </div>
                {override && (
                  <div style={{
                    fontSize: "0.7rem",
                    color: override.enabled ? "#059669" : "#DC2626",
                    marginTop: "0.5rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: override.enabled ? "#D1FAE5" : "#FEE2E2",
                    borderRadius: "4px"
                  }}>
                    {override.enabled ? "✓ Aktiviert" : "✗ Deaktiviert"} während Trial
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Trial Entitlement Overrides */}
      <div>
        <h5 style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.75rem"
        }}>
          Limits während Trial
        </h5>
        <p style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          marginBottom: "1rem"
        }}>
          Überschreiben Sie die Limits für die Testphase. Standardmäßig gelten die Limits des Pricing Plans.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.5rem",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {entitlements.map((entitlement) => {
            const override = getEntitlementOverride(entitlement.key)
            const definition = getEntitlementDefinition(entitlement.key)
            const Icon = getEntitlementIcon(entitlement.key)

            return (
              <div
                key={entitlement.id}
                style={{
                  padding: "1rem",
                  border: override ? "2px solid #E20074" : "1px solid #E5E5E5",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "0",
                  maxWidth: "100%",
                  boxSizing: "border-box"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem"
                }}>
                  {Icon && (
                    <div style={{
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#E20074"
                    }}>
                      <Icon />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#0A0A0A"
                    }}>
                      {definition.label}
                    </div>
                    {definition.description && (
                      <div style={{
                        fontSize: "0.75rem",
                        color: "#7A7A7A",
                        marginTop: "0.25rem"
                      }}>
                        {definition.description}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
                  <input
                    type="number"
                    min="0"
                    value={override?.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseInt(e.target.value)
                      handleEntitlementChange(entitlement.key, value)
                    }}
                    placeholder="Unbegrenzt"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E5E5",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      boxSizing: "border-box"
                    }}
                  />
                  <div style={{
                    fontSize: "0.75rem",
                    color: "#7A7A7A",
                    marginTop: "0.5rem",
                    lineHeight: "1.4"
                  }}>
                    {override ? "Trial-Override aktiv" : "Leer = Pricing Plan Limit"}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


