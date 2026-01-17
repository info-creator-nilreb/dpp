"use client"

import { useState, useEffect } from "react"

interface SupplierConfig {
  enabled: boolean
  mode: "input" | "declaration" | null
  allowedRoles?: string[]
}

interface SupplierConfigButtonProps {
  blockId: string
  blockOrder: number
  dppId: string | null
  config: SupplierConfig | null
  onUpdate: (config: SupplierConfig | null) => void
  loading?: boolean
}

/**
 * Supplier Config Button Component
 * 
 * Zeigt ein LKW-Icon im Block-Header an.
 * Klick öffnet ein Popover zur Konfiguration der Lieferanten-Dateneingabe.
 * 
 * WICHTIG: Nur für Blöcke mit order > 0 (nicht für Produktidentität)
 */
export default function SupplierConfigButton({
  blockId,
  blockOrder,
  dppId,
  config,
  onUpdate,
  loading = false
}: SupplierConfigButtonProps) {
  const [open, setOpen] = useState(false)

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-supplier-config-popover]')) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Produktidentität (order === 0) darf keine Supplier-Config haben
  if (blockOrder === 0) {
    return null
  }
  
  // Bei neuen DPPs (dppId === null) wird die Config im lokalen State gehalten
  // und beim ersten Speichern mit übertragen

  const isEnabled = config?.enabled === true

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        data-supplier-config-popover
        onClick={() => setOpen(!open)}
        disabled={loading}
        title="Datenquelle konfigurieren"
        style={{
          padding: "0.5rem",
          backgroundColor: "transparent",
          color: isEnabled ? "#24c598" : "#7A7A7A",
          border: isEnabled ? "1px solid #24c598" : "1px solid #CDCDCD",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          opacity: loading ? 0.5 : 1,
          transition: "all 0.2s",
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "#F5F5F5"
            if (!isEnabled) {
              e.currentTarget.style.borderColor = "#7A7A7A"
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "transparent"
            if (!isEnabled) {
              e.currentTarget.style.borderColor = "#CDCDCD"
            }
          }
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          data-supplier-config-popover
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.5rem",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            padding: "1rem",
            minWidth: "320px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              marginBottom: "0.75rem",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#0A0A0A",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  onUpdate({
                    enabled: true,
                    mode: config?.mode || "input",
                    allowedRoles: config?.allowedRoles || []
                  })
                } else {
                  onUpdate(null)
                  setOpen(false)
                }
              }}
              disabled={loading}
              style={{
                width: "18px",
                height: "18px",
                marginTop: "0.125rem",
                cursor: loading ? "not-allowed" : "pointer",
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: "0.25rem" }}>Datenquelle: Lieferkette</div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#7A7A7A",
                  margin: 0,
                  lineHeight: "1.4",
                  fontWeight: "400"
                }}
              >
                Lieferanten können Daten für diesen Abschnitt bereitstellen. Die
                Veröffentlichung und rechtliche Verantwortung verbleibt beim Economic
                Operator.
              </p>
            </div>
          </label>

          {isEnabled && (
            <div
              style={{
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #E5E5E5",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "0.5rem"
                  }}
                >
                  Art der Datenerfassung
                </label>
                <select
                  value={config?.mode || "input"}
                  onChange={(e) => {
                    onUpdate({
                      ...config!,
                      mode: e.target.value as "input" | "declaration"
                    })
                  }}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    backgroundColor: loading ? "#F5F5F5" : "#FFFFFF",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  <option value="input">Direkte Datenerfassung</option>
                  <option value="declaration">Bestätigung vorhandener Daten</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "0.5rem"
                  }}
                >
                  Lieferantenrollen (Filter für Einladungen, optional)
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}
                >
                  {[
                    "Material supplier",
                    "Manufacturer",
                    "Processor / Finisher",
                    "Recycler",
                    "Other"
                  ].map((role) => (
                    <label
                      key={role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.875rem",
                        color: "#0A0A0A",
                        cursor: loading ? "not-allowed" : "pointer"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          config?.allowedRoles?.includes(role) || false
                        }
                        onChange={(e) => {
                          const currentRoles = config?.allowedRoles || []
                          if (e.target.checked) {
                            onUpdate({
                              ...config!,
                              allowedRoles: [...currentRoles, role]
                            })
                          } else {
                            onUpdate({
                              ...config!,
                              allowedRoles: currentRoles.filter((r) => r !== role)
                            })
                          }
                        }}
                        disabled={loading}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: loading ? "not-allowed" : "pointer",
                          flexShrink: 0
                        }}
                      />
                      <span>
                        {role === "Material supplier"
                          ? "Materiallieferant"
                          : role === "Manufacturer"
                          ? "Hersteller"
                          : role === "Processor / Finisher"
                          ? "Verarbeiter / Veredler"
                          : role === "Recycler"
                          ? "Recycler"
                          : "Sonstiges"}
                      </span>
                    </label>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#7A7A7A",
                    marginTop: "0.5rem",
                    marginBottom: 0
                  }}
                >
                  Wenn keine Rollen ausgewählt werden, können alle Rollen für
                  Einladungen verwendet werden.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

