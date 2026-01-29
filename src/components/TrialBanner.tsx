"use client"

import Link from "next/link"

interface TrialBannerProps {
  organizationId: string
  trialEndDate: string
}

function TrialBanner({ organizationId, trialEndDate }: TrialBannerProps) {
  // Calculate days remaining
  const now = new Date()
  const expiresAt = new Date(trialEndDate)
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div style={{
      backgroundColor: "#FEF3C7",
      border: "1px solid #FCD34D",
      borderRadius: "8px",
      padding: "1rem 1.5rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "1rem",
      marginBottom: "24px"
    }}>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#92400E",
          marginBottom: "0.25rem"
        }}>
          🎉 Sie befinden sich in der Testphase
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "#78350F"
        }}>
          {daysRemaining > 0
            ? `${daysRemaining} Tag${daysRemaining !== 1 ? "e" : ""} verbleibend`
            : "Testphase läuft ab"}
          <span style={{ marginLeft: "0.5rem" }}>
            (bis {expiresAt.toLocaleDateString("de-DE")})
          </span>
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "#78350F",
          marginTop: "0.5rem"
        }}>
          Während der Testphase können Sie Entwürfe erstellen, aber keine DPPs veröffentlichen.
        </div>
      </div>
      <Link
        href="/pricing"
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#24c598",
          color: "#FFFFFF",
          textDecoration: "none",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "600",
          whiteSpace: "nowrap",
          transition: "background-color 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#C00060"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#24c598"
        }}
      >
        Jetzt upgraden
      </Link>
    </div>
  )
}

export default TrialBanner
export { TrialBanner }
