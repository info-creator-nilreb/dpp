"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { getEntitlementIcon } from "@/components/EntitlementIcons"
import { getFeatureDescription } from "@/lib/pricing/feature-translations"
import TrialOverridesSection from "./TrialOverridesSection"
import Link from "next/link"

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
  trialFeatureOverrides?: TrialFeatureOverride[]
  trialEntitlementOverrides?: TrialEntitlementOverride[]
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

interface PricingPlanEditorProps {
  pricingPlan: PricingPlan
  availableFeatures: Feature[]
  entitlements: Entitlement[]
}

export default function PricingPlanEditor({
  pricingPlan,
  availableFeatures,
  entitlements
}: PricingPlanEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"basic" | "features" | "limits" | "subscriptions">("basic")

  const [formData, setFormData] = useState({
    name: pricingPlan.name,
    slug: pricingPlan.slug,
    descriptionMarketing: pricingPlan.descriptionMarketing || "",
    isPublic: pricingPlan.isPublic,
    isActive: pricingPlan.isActive,
    displayOrder: pricingPlan.displayOrder,
    selectedFeatures: pricingPlan.features
      .filter(f => f.included)
      .map(f => f.featureKey),
    selectedEntitlements: pricingPlan.entitlements.reduce((acc, e) => {
      acc[e.entitlementKey] = e.value
      return acc
    }, {} as Record<string, number | null>)
  })

  const handleSaveBasic = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(`/api/super-admin/pricing/plans/${pricingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          descriptionMarketing: formData.descriptionMarketing || null,
          isPublic: formData.isPublic,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFeatures = async () => {
    setLoading(true)
    setError(null)

    try {
      const features = formData.selectedFeatures.map(key => ({
        featureKey: key,
        included: true,
        note: null
      }))

      const response = await apiFetch(`/api/super-admin/pricing/plans/${pricingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          features
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLimits = async () => {
    setLoading(true)
    setError(null)

    try {
      const entitlementsData = Object.entries(formData.selectedEntitlements)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
          entitlementKey: key,
          value: value === null ? null : Number(value)
        }))

      const response = await apiFetch(`/api/super-admin/pricing/plans/${pricingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          entitlements: entitlementsData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency
    }).format(amount / 100)
  }

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      border: "1px solid #E5E5E5",
      overflow: "hidden",
      width: "100%"
    }}>
      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #E5E5E5",
        backgroundColor: "#F9F9F9",
        overflowX: "auto",
        overflowY: "hidden",
        width: "100%",
        minWidth: 0
      }}>
        <button
          key="basic"
          type="button"
          onClick={() => setActiveTab("basic")}
          style={{
            padding: "1rem 1.5rem",
            border: "none",
            backgroundColor: "transparent",
            borderBottom: activeTab === "basic" ? "2px solid #24c598" : "2px solid transparent",
            color: activeTab === "basic" ? "#24c598" : "#7A7A7A",
            fontSize: "0.875rem",
            fontWeight: activeTab === "basic" ? "600" : "400",
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Grundinformationen
        </button>
        <button
          key="features"
          type="button"
          onClick={() => setActiveTab("features")}
          style={{
            padding: "1rem 1.5rem",
            border: "none",
            backgroundColor: "transparent",
            borderBottom: activeTab === "features" ? "2px solid #24c598" : "2px solid transparent",
            color: activeTab === "features" ? "#24c598" : "#7A7A7A",
            fontSize: "0.875rem",
            fontWeight: activeTab === "features" ? "600" : "400",
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Features
        </button>
        <button
          key="limits"
          type="button"
          onClick={() => setActiveTab("limits")}
          style={{
            padding: "1rem 1.5rem",
            border: "none",
            backgroundColor: "transparent",
            borderBottom: activeTab === "limits" ? "2px solid #24c598" : "2px solid transparent",
            color: activeTab === "limits" ? "#24c598" : "#7A7A7A",
            fontSize: "0.875rem",
            fontWeight: activeTab === "limits" ? "600" : "400",
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Limits
        </button>
        <button
          key="subscriptions"
          type="button"
          onClick={() => setActiveTab("subscriptions")}
          style={{
            padding: "1rem 1.5rem",
            border: "none",
            backgroundColor: "transparent",
            borderBottom: activeTab === "subscriptions" ? "2px solid #24c598" : "2px solid transparent",
            color: activeTab === "subscriptions" ? "#24c598" : "#7A7A7A",
            fontSize: "0.875rem",
            fontWeight: activeTab === "subscriptions" ? "600" : "400",
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Abo-Modelle
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "2rem" }}>
        {error && (
          <div style={{
            padding: "1rem",
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: "8px",
            marginBottom: "1.5rem"
          }}>
            {error}
          </div>
        )}

        {/* Basic Information Tab */}
        {activeTab === "basic" && (
          <div>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1.5rem"
            }}>
              Grundinformationen
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#0A0A0A",
                  marginBottom: "0.5rem"
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "6px",
                    fontSize: "0.875rem"
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#0A0A0A",
                  marginBottom: "0.5rem"
                }}>
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "6px",
                    fontSize: "0.875rem"
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#0A0A0A",
                  marginBottom: "0.5rem"
                }}>
                  Marketing-Beschreibung
                </label>
                <textarea
                  value={formData.descriptionMarketing}
                  onChange={(e) => setFormData({ ...formData, descriptionMarketing: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "2rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer"
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                  <span style={{ fontSize: "0.875rem" }}>Öffentlich sichtbar</span>
                </label>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer"
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span style={{ fontSize: "0.875rem" }}>Aktiv</span>
                </label>
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#0A0A0A",
                  marginBottom: "0.5rem"
                }}>
                  Anzeigereihenfolge
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "6px",
                    fontSize: "0.875rem"
                  }}
                />
              </div>

              <div style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem"
              }}>
                <button
                  type="button"
                  onClick={handleSaveBasic}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: loading ? "#CCCCCC" : "#24c598",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Wird gespeichert..." : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <div>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1rem"
            }}>
              Features
            </h2>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              marginBottom: "1.5rem"
            }}>
              Wählen Sie Features aus dem Feature Registry aus (read-only)
            </p>
            {formData.selectedFeatures.some((k) => k.startsWith("block_")) &&
             !formData.selectedFeatures.includes("content_tab") && (
              <div style={{
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                backgroundColor: "#FEF3C7",
                border: "1px solid #F59E0B",
                borderRadius: "8px",
                fontSize: "0.875rem",
                color: "#92400E"
              }}>
                Content-Blöcke (z. B. Text, Bild, Akkordeon, Timeline) sind nur nutzbar, wenn der <strong>Mehrwert-Tab</strong> aktiviert ist. Bitte aktivieren Sie den Mehrwert-Tab, damit die gewählten Blöcke für Nutzer sichtbar sind.
              </div>
            )}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "0.75rem",
              maxHeight: "500px",
              overflowY: "auto",
              padding: "0.5rem"
            }}>
              {availableFeatures.map((feature) => (
                <label
                  key={feature.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: formData.selectedFeatures.includes(feature.key) ? "#F0F9FF" : "#FFFFFF"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedFeatures.includes(feature.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          selectedFeatures: [...formData.selectedFeatures, feature.key]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          selectedFeatures: formData.selectedFeatures.filter(k => k !== feature.key)
                        })
                      }
                    }}
                  />
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
                      {feature.name}
                    </div>
                    {feature.description && (
                      <div style={{ fontSize: "0.75rem", color: "#7A7A7A", marginTop: "0.25rem" }}>
                        {getFeatureDescription(feature.key, feature.description)}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1.5rem"
            }}>
              <button
                type="button"
                onClick={handleSaveFeatures}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: loading ? "#CCCCCC" : "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Wird gespeichert..." : "Features speichern"}
              </button>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === "limits" && (
          <div>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Limits
            </h2>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              marginBottom: "1.5rem"
            }}>
              Konfigurieren Sie die Quantität für jeden Limit-Typ. Geben Sie einen Wert ein oder lassen Sie das Feld leer für unbegrenzte Nutzung.
            </p>
            
            {entitlements.length === 0 ? (
              <div style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "#F9F9F9",
                borderRadius: "8px",
                border: "1px dashed #E5E5E5"
              }}>
                <p style={{ color: "#7A7A7A", marginBottom: "0.5rem" }}>
                  Noch keine Limit-Typen definiert
                </p>
                <p style={{ fontSize: "0.75rem", color: "#9A9A9A" }}>
                  Limit-Typen müssen systemweit erstellt werden
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.5rem",
                width: "100%",
                boxSizing: "border-box",
                alignItems: "stretch"
              }}>
                {entitlements.map((entitlement) => {
                  const currentValue = formData.selectedEntitlements[entitlement.key] ?? null
                  
                  return (
                    <ConfigurableLimitInput
                      key={entitlement.id}
                      entitlement={entitlement}
                      value={currentValue}
                      onChange={(newValue) => {
                        setFormData({
                          ...formData,
                          selectedEntitlements: {
                            ...formData.selectedEntitlements,
                            [entitlement.key]: newValue
                          }
                        })
                      }}
                      onRemove={() => {
                        const newEntitlements = { ...formData.selectedEntitlements }
                        delete newEntitlements[entitlement.key]
                        setFormData({
                          ...formData,
                          selectedEntitlements: newEntitlements
                        })
                      }}
                      showRemove={currentValue !== null && currentValue !== undefined}
                    />
                  )
                })}
              </div>
            )}

            <div style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1.5rem"
            }}>
              <button
                type="button"
                onClick={handleSaveLimits}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: loading ? "#CCCCCC" : "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Wird gespeichert..." : "Limits speichern"}
              </button>
            </div>
          </div>
        )}

        {/* Subscription Models Tab */}
        {activeTab === "subscriptions" && (
          <div style={{ width: "100%" }}>
            <SubscriptionModelsSection
              pricingPlanId={pricingPlan.id}
              subscriptionModels={pricingPlan.subscriptionModels}
              availableFeatures={availableFeatures}
              entitlements={entitlements}
              onUpdate={() => router.refresh()}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Entitlement Input Component
function EntitlementInput({
  entitlement,
  value,
  onChange
}: {
  entitlement: Entitlement
  value: string | number | null
  onChange: (value: number | null) => void
}) {
  const definition = getEntitlementDefinition(entitlement.key)
  const icon = getEntitlementIcon(definition.icon, 18, "#7A7A7A")
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div
      style={{
        padding: "1.25rem",
        border: `1px solid ${isFocused ? "#24c598" : "#E5E5E5"}`,
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        marginBottom: "0.75rem",
        flex: "1 1 auto"
      }}>
        {icon && (
          <div style={{
            marginTop: "0.125rem",
            color: "#7A7A7A",
            flexShrink: 0
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.25rem",
            flexWrap: "wrap"
          }}>
            <label style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              {definition.label}
            </label>
            {definition.unit && definition.unit !== "count" && (
              <span style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                fontWeight: "400"
              }}>
                ({definition.unit})
              </span>
            )}
          </div>
          <p style={{
            fontSize: "0.75rem",
            color: "#7A7A7A",
            margin: "0.25rem 0 0 0",
            lineHeight: "1.4"
          }}>
            {definition.description}
          </p>
        </div>
      </div>
      <div style={{
        marginTop: "auto"
      }}>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min="0"
          placeholder="Unbegrenzt"
          value={value ?? ""}
          onChange={(e) => {
            const newValue = e.target.value === "" ? null : (e.target.value === "0" ? 0 : parseInt(e.target.value))
            onChange(newValue)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "0.75rem",
            border: `1px solid ${isFocused ? "#24c598" : "#E5E5E5"}`,
            borderRadius: "6px",
            fontSize: "clamp(1rem, 2vw, 0.875rem)",
            transition: "border-color 0.2s",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
        <div style={{
          fontSize: "0.7rem",
          color: "#9A9A9A",
          marginTop: "0.5rem"
        }}>
          Leer lassen für unbegrenzte Nutzung
        </div>
      </div>
    </div>
  )
}

// Subscription Models Section Component
function SubscriptionModelsSection({
  pricingPlanId,
  subscriptionModels,
  availableFeatures,
  entitlements,
  onUpdate
}: {
  pricingPlanId: string
  subscriptionModels: SubscriptionModel[]
  availableFeatures: Feature[]
  entitlements: Entitlement[]
  onUpdate: () => void
}) {
  const [showNewModel, setShowNewModel] = useState(false)
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency
    }).format(amount / 100)
  }

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem"
      }}>
        <div>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Abo-Modelle
          </h2>
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A"
          }}>
            Definieren Sie monatliche und jährliche Abo-Modelle mit Preisen und Trial-Optionen
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModel(true)}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          + Neues Abo-Modell
        </button>
      </div>

      {error && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEE2E2",
          color: "#DC2626",
          borderRadius: "8px",
          marginBottom: "1.5rem"
        }}>
          {error}
        </div>
      )}

      {showNewModel && (
        <NewSubscriptionModelForm
          pricingPlanId={pricingPlanId}
          onClose={() => setShowNewModel(false)}
          onSuccess={() => {
            setShowNewModel(false)
            onUpdate()
          }}
        />
      )}

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        {subscriptionModels.map((model) => (
          <SubscriptionModelCard
            key={model.id}
            model={model}
            isEditing={editingModel === model.id}
            onEdit={() => setEditingModel(model.id)}
            onCancel={() => setEditingModel(null)}
            onUpdate={onUpdate}
            availableFeatures={availableFeatures}
            entitlements={entitlements}
          />
        ))}
      </div>

      {subscriptionModels.length === 0 && !showNewModel && (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          backgroundColor: "#F9F9F9",
          borderRadius: "8px",
          border: "1px dashed #E5E5E5"
        }}>
          <p style={{ color: "#7A7A7A", marginBottom: "1rem" }}>
            Noch keine Abo-Modelle definiert
          </p>
          <button
            type="button"
            onClick={() => setShowNewModel(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Erstes Abo-Modell erstellen
          </button>
        </div>
      )}
    </div>
  )
}

// Subscription Model Card Component
function SubscriptionModelCard({
  model,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  availableFeatures,
  entitlements
}: {
  model: SubscriptionModel
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onUpdate: () => void
  availableFeatures: Feature[]
  entitlements: Entitlement[]
}) {
  const formatPrice = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency
    }).format(amount / 100)
  }

  const activePrice = model.prices.find(p => p.isActive && (!p.validTo || new Date(p.validTo) > new Date()))

  if (isEditing) {
    return (
      <SubscriptionModelEditor
        model={model}
        onCancel={onCancel}
        onUpdate={onUpdate}
        availableFeatures={availableFeatures}
        entitlements={entitlements}
      />
    )
  }

  return (
    <div style={{
      padding: "1.5rem",
      border: "1px solid #E5E5E5",
      borderRadius: "8px",
      backgroundColor: "#FFFFFF"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1rem"
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "0.5rem"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              textTransform: "capitalize"
            }}>
              {model.billingInterval === "monthly" ? "Monatlich" : "Jährlich"}
            </h3>
            {!model.isActive && (
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
          </div>
          {activePrice && (
            <div style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#0A0A0A"
            }}>
              {formatPrice(activePrice.amount, activePrice.currency)}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#F5F5F5",
            color: "#0A0A0A",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer"
          }}
        >
          Bearbeiten
        </button>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        fontSize: "0.875rem",
        color: "#7A7A7A"
      }}>
        {model.trialDays > 0 && (
          <div>
            <strong style={{ color: "#0A0A0A" }}>Trial:</strong> {model.trialDays} Tage
          </div>
        )}
        {model.minCommitmentMonths && (
          <div>
            <strong style={{ color: "#0A0A0A" }}>Mindestlaufzeit:</strong> {model.minCommitmentMonths} Monate
          </div>
        )}
        {model.stripePriceId && (
          <div>
            <strong style={{ color: "#0A0A0A" }}>Stripe Price ID:</strong>{" "}
            <code style={{
              fontSize: "0.75rem",
              backgroundColor: "#F5F5F5",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px"
            }}>
              {model.stripePriceId}
            </code>
          </div>
        )}
        {model.prices.length > 1 && (
          <div>
            <strong style={{ color: "#0A0A0A" }}>Preisversionen:</strong> {model.prices.length}
          </div>
        )}
      </div>
    </div>
  )
}

// New Subscription Model Form Component
function NewSubscriptionModelForm({
  pricingPlanId,
  onClose,
  onSuccess
}: {
  pricingPlanId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    billingInterval: "monthly" as "monthly" | "yearly",
    minCommitmentMonths: "",
    trialDays: "",
    isActive: true,
    amount: "",
    currency: "EUR"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create subscription model
      const modelResponse = await apiFetch("/api/super-admin/pricing/subscription-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pricingPlanId,
          billingInterval: formData.billingInterval,
          minCommitmentMonths: formData.minCommitmentMonths ? parseInt(formData.minCommitmentMonths) : null,
          trialDays: formData.trialDays ? parseInt(formData.trialDays) : 0,
          isActive: formData.isActive
        })
      })

      if (!modelResponse.ok) {
        const data = await modelResponse.json()
        throw new Error(data.error || "Fehler beim Erstellen des Abo-Modells")
      }

      const { subscriptionModel } = await modelResponse.json()

      // Create initial price
      if (formData.amount) {
        const priceResponse = await apiFetch("/api/super-admin/pricing/prices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            subscriptionModelId: subscriptionModel.id,
            amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
            currency: formData.currency,
            isActive: true
          })
        })

        if (!priceResponse.ok) {
          const data = await priceResponse.json()
          throw new Error(data.error || "Fehler beim Erstellen des Preises")
        }
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: "1.5rem",
      border: "1px solid #E5E5E5",
      borderRadius: "8px",
      backgroundColor: "#F9F9F9",
      marginBottom: "1rem"
    }}>
      <h3 style={{
        fontSize: "1rem",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Neues Abo-Modell erstellen
      </h3>

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

      <form onSubmit={handleSubmit}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginBottom: "1rem"
        }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Abrechnungsintervall *
            </label>
            <select
              required
              value={formData.billingInterval}
              onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value as "monthly" | "yearly" })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                fontSize: "0.875rem",
                boxSizing: "border-box"
              }}
            >
              <option value="monthly">Monatlich</option>
              <option value="yearly">Jährlich</option>
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Mindestlaufzeit (Monate)
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              value={formData.minCommitmentMonths}
              onChange={(e) => setFormData({ ...formData, minCommitmentMonths: e.target.value })}
              placeholder="0 = keine Mindestlaufzeit"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                fontSize: "clamp(1rem, 2vw, 0.875rem)",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Trial-Tage
            </label>
            <input
              type="number"
              min="0"
              value={formData.trialDays}
              onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                fontSize: "0.875rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Preis (EUR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                fontSize: "clamp(1rem, 2vw, 0.875rem)",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "1rem"
        }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading ? "#CCCCCC" : "#24c598",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Wird erstellt..." : "Erstellen"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#F5F5F5",
              color: "#0A0A0A",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}

// Subscription Model Editor Component
function SubscriptionModelEditor({
  model,
  onCancel,
  onUpdate,
  availableFeatures,
  entitlements
}: {
  model: SubscriptionModel
  onCancel: () => void
  onUpdate: () => void
  availableFeatures: Feature[]
  entitlements: Entitlement[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    minCommitmentMonths: model.minCommitmentMonths?.toString() || "",
    trialDays: model.trialDays?.toString() || "",
    isActive: model.isActive
  })

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(`/api/super-admin/pricing/subscription-models/${model.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          minCommitmentMonths: formData.minCommitmentMonths ? parseInt(formData.minCommitmentMonths) : null,
          trialDays: formData.trialDays ? parseInt(formData.trialDays) : 0,
          isActive: formData.isActive
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      onUpdate()
      setLoading(false)
      // Schließe die Detailansicht nach erfolgreichem Speichern
      onCancel()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  const handleNewPrice = async (amount: number, currency: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch("/api/super-admin/pricing/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscriptionModelId: model.id,
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          isActive: true
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Erstellen des Preises")
      }

      onUpdate()
      setLoading(false)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency
    }).format(amount / 100)
  }

  const activePrice = model.prices.find(p => p.isActive && (!p.validTo || new Date(p.validTo) > new Date()))

  return (
    <div style={{
      padding: "1.5rem",
      border: "2px solid #24c598",
      borderRadius: "8px",
      backgroundColor: "#FFFFFF"
    }}>
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

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1.5rem",
        marginBottom: "1.5rem"
      }}>
        <div>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Mindestlaufzeit (Monate)
          </label>
          <input
            type="number"
            min="0"
            value={formData.minCommitmentMonths}
            onChange={(e) => setFormData({ ...formData, minCommitmentMonths: e.target.value })}
            placeholder="0 = keine Mindestlaufzeit"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #E5E5E5",
              borderRadius: "6px",
              fontSize: "0.875rem",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Trial-Tage
          </label>
            <input
              type="number"
              min="0"
              value={formData.trialDays}
              onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                fontSize: "0.875rem",
                boxSizing: "border-box"
              }}
            />
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end"
        }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            height: "2.75rem"
          }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span style={{ fontSize: "0.875rem" }}>Aktiv</span>
          </label>
        </div>
      </div>

      {/* Trial Configuration */}
      {formData.trialDays && parseInt(formData.trialDays) > 0 && (
        <div style={{
          marginTop: "1.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #E5E5E5"
        }}>
          <h4 style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1rem"
          }}>
            Trial-Konfiguration ({parseInt(formData.trialDays)} Tage)
          </h4>
          <p style={{
            fontSize: "0.75rem",
            color: "#7A7A7A",
            marginBottom: "1rem"
          }}>
            Konfigurieren Sie Features und Limits, die während der Testphase gelten
          </p>
          <TrialOverridesSection
            subscriptionModelId={model.id}
            trialFeatureOverrides={model.trialFeatureOverrides || []}
            trialEntitlementOverrides={model.trialEntitlementOverrides || []}
            availableFeatures={availableFeatures}
            entitlements={entitlements}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {/* Price Versioning */}
      <div style={{
        marginTop: "1.5rem",
        paddingTop: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <h4 style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#0A0A0A"
          }}>
            Preisversionen
          </h4>
          <NewPriceForm
            onSave={handleNewPrice}
            loading={loading}
          />
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          {model.prices.map((price) => (
            <div
              key={price.id}
              style={{
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                backgroundColor: price.isActive ? "#F0F9FF" : "#F9F9F9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#0A0A0A"
                }}>
                  {formatPrice(price.amount, price.currency)}
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  color: "#7A7A7A",
                  marginTop: "0.25rem"
                }}>
                  Gültig von: {new Date(price.validFrom).toLocaleDateString("de-DE")}
                  {price.validTo && ` bis ${new Date(price.validTo).toLocaleDateString("de-DE")}`}
                  {price.isActive && (
                    <span style={{
                      marginLeft: "0.5rem",
                      padding: "0.125rem 0.5rem",
                      backgroundColor: "#24c598",
                      color: "#FFFFFF",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: "500"
                    }}>
                      Aktiv
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: "1rem",
        marginTop: "1.5rem"
      }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: loading ? "#CCCCCC" : "#24c598",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Wird gespeichert..." : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#F5F5F5",
            color: "#0A0A0A",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer"
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

// New Price Form Component
function NewPriceForm({
  onSave,
  loading
}: {
  onSave: (amount: number, currency: string) => void
  loading: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("EUR")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount) {
      onSave(parseFloat(amount), currency)
      setAmount("")
      setCurrency("EUR")
      setShowForm(false)
    }
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#F5F5F5",
          color: "#0A0A0A",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: "pointer"
        }}
      >
        + Neuer Preis
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex",
      gap: "0.5rem",
      alignItems: "flex-end"
    }}>
      <div>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
          style={{
            padding: "0.5rem",
            border: "1px solid #E5E5E5",
            borderRadius: "6px",
            fontSize: "clamp(1rem, 2vw, 0.875rem)",
            width: "120px"
          }}
        />
      </div>
      <div>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{
            padding: "0.5rem",
            border: "1px solid #E5E5E5",
            borderRadius: "6px",
            fontSize: "0.875rem"
          }}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: loading ? "#CCCCCC" : "#24c598",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        Erstellen
      </button>
      <button
        type="button"
        onClick={() => {
          setShowForm(false)
          setAmount("")
        }}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#F5F5F5",
          color: "#0A0A0A",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: "pointer"
        }}
      >
        Abbrechen
      </button>
    </form>
  )
}


// Limit Selector Component (Dropdown for adding limits)
function LimitSelector({
  entitlements,
  selectedEntitlementKeys,
  onAdd
}: {
  entitlements: Entitlement[]
  selectedEntitlementKeys: string[]
  onAdd: (entitlementKey: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const availableEntitlements = entitlements.filter(e => !selectedEntitlementKeys.includes(e.key))

  if (availableEntitlements.length === 0) {
    return (
      <div style={{
        padding: "1rem",
        backgroundColor: "#F9F9F9",
        borderRadius: "8px",
        border: "1px solid #E5E5E5",
        fontSize: "0.875rem",
        color: "#7A7A7A"
      }}>
        Alle verfügbaren Limits wurden bereits hinzugefügt. Neue Limit-Definitionen müssen systemweit erstellt werden.
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          fontSize: "0.875rem",
          color: "#0A0A0A",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "border-color 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#24c598"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E5E5E5"
        }}
      >
        <span style={{ color: "#7A7A7A" }}>
          + Limit hinzufügen
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "#7A7A7A"
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "0.5rem",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              zIndex: 20,
              maxHeight: "300px",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {availableEntitlements.map((entitlement) => {
              const definition = getEntitlementDefinition(entitlement.key)
              const icon = getEntitlementIcon(definition.icon, 18, "#7A7A7A")
              
              return (
                <button
                  key={entitlement.id}
                  type="button"
                  onClick={() => {
                    onAdd(entitlement.key)
                    setIsOpen(false)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid #F0F0F0",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9F9F9"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  {icon && (
                    <div style={{ flexShrink: 0 }}>
                      {icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#0A0A0A",
                      marginBottom: "0.25rem"
                    }}>
                      {definition.label}
                    </div>
                    <div style={{
                      fontSize: "0.75rem",
                      color: "#7A7A7A",
                      lineHeight: "1.4"
                    }}>
                      {definition.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Configurable Limit Input Component (for limits that are already added to the plan)
function ConfigurableLimitInput({
  entitlement,
  value,
  onChange,
  onRemove,
  showRemove = false
}: {
  entitlement: Entitlement
  value: string | number | null
  onChange: (value: number | null) => void
  onRemove: () => void
  showRemove?: boolean
}) {
  const definition = getEntitlementDefinition(entitlement.key)
  const icon = getEntitlementIcon(definition.icon, 18, "#7A7A7A")
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div
      style={{
        padding: "1.25rem",
        border: `1px solid ${isFocused ? "#24c598" : "#E5E5E5"}`,
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}
    >
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            background: "none",
            border: "none",
            color: "#7A7A7A",
            cursor: "pointer",
            fontSize: "1.25rem",
            lineHeight: "1",
            padding: "0.25rem",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "background-color 0.2s, color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#FEE2E2"
            e.currentTarget.style.color = "#DC2626"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
            e.currentTarget.style.color = "#7A7A7A"
          }}
          title="Wert zurücksetzen"
        >
          ×
        </button>
      )}

      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        marginBottom: "0.75rem",
        paddingRight: showRemove ? "2rem" : "0",
        flex: "1 1 auto"
      }}>
        {icon && (
          <div style={{
            marginTop: "0.125rem",
            color: "#7A7A7A",
            flexShrink: 0
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.25rem",
            flexWrap: "wrap"
          }}>
            <label style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              {definition.label}
            </label>
            {definition.unit && definition.unit !== "count" && (
              <span style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                fontWeight: "400"
              }}>
                ({definition.unit})
              </span>
            )}
          </div>
          <p style={{
            fontSize: "0.75rem",
            color: "#7A7A7A",
            margin: "0.25rem 0 0 0",
            lineHeight: "1.4"
          }}>
            {definition.description}
          </p>
        </div>
      </div>
      <div style={{
        marginTop: "auto"
      }}>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min="0"
          placeholder="Unbegrenzt"
          value={value ?? ""}
          onChange={(e) => {
            const newValue = e.target.value === "" ? null : (e.target.value === "0" ? 0 : parseInt(e.target.value))
            onChange(newValue)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "0.75rem",
            border: `1px solid ${isFocused ? "#24c598" : "#E5E5E5"}`,
            borderRadius: "6px",
            fontSize: "clamp(1rem, 2vw, 0.875rem)",
            transition: "border-color 0.2s",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
        <div style={{
          fontSize: "0.7rem",
          color: "#9A9A9A",
          marginTop: "0.5rem"
        }}>
          Leer lassen für unbegrenzte Nutzung
        </div>
      </div>
    </div>
  )
}
