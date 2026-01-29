"use client"

interface SupplierInviteButtonProps {
  onClick: () => void
  supplierEnabledBlocksCount: number
  // existingInvitesCount wird nicht mehr verwendet (keine Badges)
}

// Group/Network Icon für Floating Control (Kollaborationsmodus)
const GroupIcon = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block" }}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

/**
 * Floating Collaboration Control
 * 
 * REIN AKTION: Neutrales Icon als Einstiegspunkt zum Beteiligten-Modal.
 * Keine Badges, keine Textlabels, keine Status-Signalisierung.
 * Status wird ausschließlich im Block-Header angezeigt.
 */
export default function SupplierInviteButton({
  onClick,
  supplierEnabledBlocksCount
}: SupplierInviteButtonProps) {
  // Erscheint erst, sobald mind. ein delegierbarer Block existiert
  if (supplierEnabledBlocksCount === 0) {
    return null
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Zuständigkeiten verwalten"
      style={{
        position: "fixed",
        right: "1.5rem",
        // Save Bar ist ca. 120-140px hoch (mit Padding, 2 Zeilen), 20px Abstand darüber
        bottom: "160px", // 140px Save Bar + 20px Abstand
        zIndex: 1000, // Über der Save Bar (z-index: 999)
        padding: "0.625rem",
        backgroundColor: "#FFFFFF",
        color: "#7A7A7A",
        border: "1px solid #E5E5E5",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#CDCDCD"
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
        e.currentTarget.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E5E5E5"
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)"
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      <GroupIcon size={22} color="currentColor" />
    </button>
  )
}
