"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { getEntitlementIcon } from "@/components/EntitlementIcons"
import { getFeatureDescription } from "@/lib/pricing/feature-translations"
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

interface NewPricingPlanContentProps {
  availableFeatures: Feature[]
  entitlements: Entitlement[]
}

export default function NewPricingPlanContent({
  availableFeatures,
  entitlements
}: NewPricingPlanContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    descriptionMarketing: "",
    isPublic: true,
    isActive: true,
    displayOrder: 0,
    selectedFeatures: [] as string[],
    selectedEntitlements: {} as Record<string, number | null>
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Prepare features
      const features = availableFeatures
        .filter(f => formData.selectedFeatures.includes(f.key))
        .map(f => ({
          featureKey: f.key,
          included: true,
          note: null
        }))

      // Prepare entitlements
      const entitlementsData = Object.entries(formData.selectedEntitlements)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
          entitlementKey: key,
          value: value === null ? null : Number(value)
        }))

      const response = await apiFetch("/api/super-admin/pricing/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          descriptionMarketing: formData.descriptionMarketing || null,
          isPublic: formData.isPublic,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
          features,
          entitlements: entitlementsData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Erstellen des Pricing Plans")
      }

      // Redirect to pricing plans list
      router.push("/super-admin/pricing")
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      padding: "2rem",
      border: "1px solid #E5E5E5"
    }}>
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

      {/* Basic Information */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Grundinformationen
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: generateSlug(e.target.value)
                })
              }}
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
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Features
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "0.75rem",
          maxHeight: "400px",
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
      </div>

      {/* Entitlements */}
      <div style={{ marginBottom: "2rem" }}>
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
      </div>

      {/* Actions */}
      <div style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "flex-end",
        paddingTop: "1.5rem",
        borderTop: "1px solid #E5E5E5"
      }}>
        <button
          type="button"
          onClick={() => router.back()}
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
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: loading ? "#CCCCCC" : "#E20074",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Wird erstellt..." : "Pricing Plan erstellen"}
        </button>
      </div>
    </form>
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
        border: `1px solid ${isFocused ? "#E20074" : "#E5E5E5"}`,
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
            border: `1px solid ${isFocused ? "#E20074" : "#E5E5E5"}`,
            borderRadius: "6px",
            fontSize: "0.875rem",
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
          e.currentTarget.style.borderColor = "#E20074"
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
        border: `1px solid ${isFocused ? "#E20074" : "#E5E5E5"}`,
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
            border: `1px solid ${isFocused ? "#E20074" : "#E5E5E5"}`,
            borderRadius: "6px",
            fontSize: "0.875rem",
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
