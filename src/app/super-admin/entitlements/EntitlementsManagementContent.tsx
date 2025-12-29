"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { getEntitlementIcon } from "@/components/EntitlementIcons"

interface Entitlement {
  id: string
  key: string
  type: string
  unit: string | null
  createdAt: string
  updatedAt: string
}

interface EntitlementsManagementContentProps {
  entitlements: Entitlement[]
}

export default function EntitlementsManagementContent({
  entitlements: initialEntitlements
}: EntitlementsManagementContentProps) {
  const router = useRouter()
  const [entitlements, setEntitlements] = useState(initialEntitlements)
  const [showNewForm, setShowNewForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newEntitlement, setNewEntitlement] = useState({
    key: "",
    type: "limit" as "limit" | "boolean",
    unit: ""
  })

  const handleCreate = async () => {
    if (!newEntitlement.key.trim()) {
      setError("Key ist erforderlich")
      return
    }

    // Validate key format (should be lowercase, underscore-separated)
    const keyPattern = /^[a-z][a-z0-9_]*$/
    if (!keyPattern.test(newEntitlement.key)) {
      setError("Key muss mit einem Kleinbuchstaben beginnen und nur Kleinbuchstaben, Zahlen und Unterstriche enthalten")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch("/api/super-admin/pricing/entitlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key: newEntitlement.key.trim(),
          type: newEntitlement.type,
          unit: newEntitlement.unit.trim() || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Erstellen")
      }

      const { entitlement } = await response.json()
      setEntitlements([...entitlements, entitlement])
      setNewEntitlement({ key: "", type: "limit", unit: "" })
      setShowNewForm(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
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
            Verfügbare Limits
          </h2>
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A"
          }}>
            Diese Limits können in Pricing Plans konfiguriert werden. Keys sind technische Identifikatoren und sollten stabil bleiben.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm(!showNewForm)}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: showNewForm ? "#7A7A7A" : "#E20074",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
        >
          {showNewForm ? "Abbrechen" : "Neues Limit"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "0.75rem",
          backgroundColor: "#FEE2E2",
          color: "#DC2626",
          borderRadius: "6px",
          marginBottom: "1.5rem",
          fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      {showNewForm && (
        <div style={{
          padding: "1.5rem",
          backgroundColor: "#F9F9F9",
          borderRadius: "8px",
          border: "1px solid #E5E5E5",
          marginBottom: "1.5rem"
        }}>
          <h3 style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1rem"
          }}>
            Neues Limit erstellen
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
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
                Technischer Key *
              </label>
              <input
                type="text"
                value={newEntitlement.key}
                onChange={(e) => setNewEntitlement({ ...newEntitlement, key: e.target.value })}
                placeholder="z.B. max_api_calls"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #E5E5E5",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box"
                }}
              />
              <p style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                marginTop: "0.25rem"
              }}>
                Nur Kleinbuchstaben, Zahlen und Unterstriche. Muss mit einem Buchstaben beginnen.
              </p>
            </div>
            <div>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Typ *
              </label>
              <select
                value={newEntitlement.type}
                onChange={(e) => setNewEntitlement({ ...newEntitlement, type: e.target.value as "limit" | "boolean" })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #E5E5E5",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box"
                }}
              >
                <option value="limit">Limit (numerisch)</option>
                <option value="boolean">Boolean (ja/nein)</option>
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
                Einheit (optional)
              </label>
              <input
                type="text"
                value={newEntitlement.unit}
                onChange={(e) => setNewEntitlement({ ...newEntitlement, unit: e.target.value })}
                placeholder="z.B. GB, count, MB"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #E5E5E5",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box"
                }}
              />
              <p style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                marginTop: "0.25rem"
              }}>
                Einheit für die Anzeige (z.B. "GB" für Speicher, "count" für Anzahl)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !newEntitlement.key.trim()}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading || !newEntitlement.key.trim() ? "#CCCCCC" : "#E20074",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: loading || !newEntitlement.key.trim() ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Wird erstellt..." : "Limit erstellen"}
          </button>
        </div>
      )}

      {entitlements.length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          backgroundColor: "#F9F9F9",
          borderRadius: "12px",
          border: "1px solid #E5E5E5"
        }}>
          <p style={{ color: "#7A7A7A", fontSize: "1rem", marginBottom: "1rem" }}>
            Noch keine Limits definiert
          </p>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            style={{
              backgroundColor: "#E20074",
              color: "#FFFFFF",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Erstes Limit erstellen
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem"
        }}>
          {entitlements.map((entitlement) => {
            const definition = getEntitlementDefinition(entitlement.key)
            const icon = getEntitlementIcon(definition.icon, 24, "#E20074")

            return (
              <div
                key={entitlement.id}
                style={{
                  padding: "1.5rem",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px solid #E5E5E5"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  marginBottom: "1rem"
                }}>
                  {icon && (
                    <div style={{ flexShrink: 0 }}>
                      {icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#0A0A0A",
                      marginBottom: "0.25rem",
                      wordWrap: "break-word",
                      overflowWrap: "break-word"
                    }}>
                      {definition.label}
                    </div>
                    <div style={{
                      fontSize: "0.75rem",
                      color: "#7A7A7A",
                      fontFamily: "monospace",
                      marginBottom: "0.5rem"
                    }}>
                      {entitlement.key}
                    </div>
                    <p style={{
                      fontSize: "0.75rem",
                      color: "#7A7A7A",
                      margin: 0,
                      lineHeight: "1.4"
                    }}>
                      {definition.description}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  gap: "0.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #F0F0F0"
                }}>
                  <span style={{
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "#F0F9FF",
                    color: "#0369A1",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "500"
                  }}>
                    {entitlement.type === "limit" ? "Limit" : "Boolean"}
                  </span>
                  {entitlement.unit && (
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#F5F5F5",
                      color: "#7A7A7A",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "500"
                    }}>
                      {entitlement.unit}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


