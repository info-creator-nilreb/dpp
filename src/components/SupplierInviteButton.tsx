"use client"

import { useState } from "react"

interface SupplierInviteButtonProps {
  onClick: () => void
  supplierEnabledBlocksCount: number
  existingInvitesCount: number
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
 * Icon-only, rechts positioniert, Text nur bei Hover.
 * Immer sichtbar, dezent, kein starker Button-Look.
 */
export default function SupplierInviteButton({
  onClick,
  supplierEnabledBlocksCount,
  existingInvitesCount
}: SupplierInviteButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Erscheint erst, sobald mind. ein delegierbarer Block existiert
  if (supplierEnabledBlocksCount === 0) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        right: "1.5rem",
        // Save Bar ist ca. 120-140px hoch (mit Padding, 2 Zeilen), 20px Abstand darüber
        bottom: "160px", // 140px Save Bar + 20px Abstand
        zIndex: 1000, // Über der Save Bar (z-index: 999)
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}
    >
      {/* Text (nur bei Hover) */}
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: "400",
          color: "#24c598",
          whiteSpace: "nowrap",
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateX(0)" : "translateX(-10px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          pointerEvents: "none"
        }}
      >
        Partner einbinden
      </span>

      {/* Icon Button */}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Partner einbinden"
        style={{
          padding: "0.625rem",
          backgroundColor: "#FFFFFF",
          color: "#24c598",
          border: "1px solid rgba(36, 197, 152, 0.2)",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          transition: "all 0.2s ease",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(36, 197, 152, 0.4)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(36, 197, 152, 0.15)"
          e.currentTarget.style.transform = "translateY(-2px)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(36, 197, 152, 0.2)"
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)"
          e.currentTarget.style.transform = "translateY(0)"
        }}
      >
        <GroupIcon size={22} color="#24c598" />
        
        {/* Badge für Anzahl (nur wenn > 0) */}
        {existingInvitesCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              borderRadius: "9px",
              fontSize: "0.688rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              border: "2px solid #FFFFFF",
              boxSizing: "border-box"
            }}
          >
            {existingInvitesCount}
          </span>
        )}
      </button>
    </div>
  )
}
