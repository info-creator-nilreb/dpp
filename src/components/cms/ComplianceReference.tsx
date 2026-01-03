"use client"

/**
 * Compliance Reference
 * 
 * Read-only display of compliance sections
 * Mit kleinem Schloss-Icon im Projekt-Stil
 */

import { useState, useEffect } from "react"

interface ComplianceReferenceProps {
  dppId: string
}

export default function ComplianceReference({ dppId }: ComplianceReferenceProps) {
  const [dpp, setDpp] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDpp() {
      try {
        const response = await fetch(`/api/app/dpp/${dppId}`, { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setDpp(data.dpp)
        }
      } catch (error) {
        console.error("Error loading DPP:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDpp()
  }, [dppId])

  if (loading) {
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "1.5rem"
      }}>
        <div style={{ color: "#7A7A7A" }}>Lade...</div>
      </div>
    )
  }

  if (!dpp) return null

  const complianceSections = [
    { label: "Produktname", value: dpp.name },
    { label: "SKU / Interne ID", value: dpp.sku },
    { label: "GTIN", value: dpp.gtin },
    { label: "Marke / Hersteller", value: dpp.brand },
    { label: "Herstellungsland", value: dpp.countryOfOrigin },
    { label: "Materialien", value: dpp.materials },
    { label: "Pflegehinweise", value: dpp.careInstructions },
    { label: "Konformitätserklärung", value: dpp.conformityDeclaration },
  ].filter(section => section.value)

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E5E5",
      borderRadius: "12px",
      overflow: "hidden"
    }}>
      {/* Header mit kleinem Schloss-Icon */}
      <div style={{
        backgroundColor: "#F9F9F9",
        borderBottom: "1px solid #E5E5E5",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "6px"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#7A7A7A" }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.25rem"
          }}>
            Pflichtinformationen
          </h3>
          <p style={{
            fontSize: "0.75rem",
            color: "#7A7A7A",
            margin: 0,
            lineHeight: "1.4"
          }}>
            Diese Informationen sind Teil des ESPR-konformen Produktpasses und können nicht frei angeordnet oder entfernt werden.
          </p>
        </div>
      </div>

      {/* Compliance Sections */}
      <div style={{ padding: "1.5rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem"
        }}>
          {complianceSections.map((section, index) => (
            <div key={index} style={{
              padding: "1rem",
              backgroundColor: "#F9F9F9",
              border: "1px solid #E5E5E5",
              borderRadius: "8px"
            }}>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: "500",
                color: "#7A7A7A",
                marginBottom: "0.5rem"
              }}>
                {section.label}
              </div>
              <div style={{
                fontSize: "0.875rem",
                color: "#0A0A0A",
                fontWeight: "500"
              }}>
                {section.value || <span style={{ color: "#7A7A7A", fontStyle: "italic" }}>Nicht angegeben</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
