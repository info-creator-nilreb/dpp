"use client"

/**
 * DPP Branding Tab
 * 
 * Global branding settings for the DPP
 * - Logo upload
 * - Primary and secondary colors
 * - Clean, minimal UI
 */

import { StylingConfig, UpdateStylingRequest } from "@/lib/cms/types"
import StylingEditor from "@/components/cms/StylingEditor"
import { useNotification } from "@/components/NotificationProvider"

interface DppBrandingTabProps {
  dppId: string
  styling: StylingConfig | null
  onStylingChange: (styling: StylingConfig | null) => void
  availableFeatures: string[]
}

export default function DppBrandingTab({
  dppId,
  styling,
  onStylingChange,
  availableFeatures
}: DppBrandingTabProps) {
  const { showNotification } = useNotification()
  
  // Accept both cms_styling (Premium) and advanced_styling (Pro/Premium)
  const hasStyling = availableFeatures.includes("cms_styling") || availableFeatures.includes("advanced_styling")

  async function handleUpdateStyling(updates: UpdateStylingRequest) {
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/styling`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Aktualisieren")
      }

      const data = await response.json()
      onStylingChange(data.styling || null)
      showNotification("Branding-Einstellungen gespeichert", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Aktualisieren", "error")
    }
  }

  // Premium locked state
  if (!hasStyling) {
    return (
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "3rem 2rem",
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          maxWidth: "500px",
          textAlign: "center"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#ECFDF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem"
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#24c598"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#0A0A0A",
            marginBottom: "0.75rem"
          }}>
            Branding ist im Premium-Tarif verfügbar
          </h3>
          <p style={{
            fontSize: "1rem",
            color: "#7A7A7A",
            lineHeight: 1.6,
            marginBottom: "2rem"
          }}>
            Passen Sie die Darstellung Ihres Produktpasses an Ihre Marke an.
            Logo, Farben und Schriftarten individuell gestalten.
          </p>
          <a
            href="/app/settings/subscription"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#C20062"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#24c598"
            }}
          >
            Jetzt upgraden
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "2rem",
      backgroundColor: "#FFFFFF"
    }}>
      {/* Header */}
      <div style={{
        marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Branding
        </h2>
        <p style={{
          fontSize: "0.875rem",
          color: "#7A7A7A",
          lineHeight: 1.6,
          margin: 0
        }}>
          Passen Sie die Darstellung Ihres Produktpasses an Ihre Marke an.
          Diese Einstellungen wirken sich auf die Vorschau und Veröffentlichung aus.
        </p>
      </div>

      {/* Branding Editor */}
      <StylingEditor
        styling={styling}
        onUpdate={handleUpdateStyling}
        dppId={dppId}
      />
    </div>
  )
}

