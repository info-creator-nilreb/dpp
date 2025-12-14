"use client"

import Link from "next/link"

interface VersionCardProps {
  href: string
  version: number
  createdAt: Date
  createdBy: string
  hasQrCode: boolean
  dppId: string
}

/**
 * Version-Card mit QR-Code-Icon
 */
export default function VersionCard({ href, version, createdAt, createdBy, hasQrCode, dppId }: VersionCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const QrCodeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="5" height="5"/>
      <rect x="16" y="3" width="5" height="5"/>
      <rect x="3" y="16" width="5" height="5"/>
      <line x1="8" y1="8" x2="8" y2="8"/>
      <line x1="16" y1="8" x2="16" y2="8"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="12" y1="11" x2="12" y2="11"/>
      <line x1="12" y1="13" x2="12" y2="13"/>
      <line x1="16" y1="11" x2="16" y2="11"/>
      <line x1="16" y1="13" x2="16" y2="13"/>
    </svg>
  )

  return (
    <div
      style={{
        display: "block",
        backgroundColor: "#FFFFFF",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s",
        position: "relative"
      }}
    >
      <Link
        href={href}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block"
        }}
        onMouseEnter={(e) => {
          const card = e.currentTarget.closest("div")
          if (card) {
            card.style.borderColor = "#E20074"
            card.style.boxShadow = "0 2px 8px rgba(226, 0, 116, 0.1)"
          }
        }}
        onMouseLeave={(e) => {
          const card = e.currentTarget.closest("div")
          if (card) {
            card.style.borderColor = "#CDCDCD"
            card.style.boxShadow = "none"
          }
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap"
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem"
            }}>
              <span style={{
                fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)",
                fontWeight: "700",
                color: "#0A0A0A"
              }}>
                Version {version}
              </span>
              <span style={{
                padding: "0.25rem 0.5rem",
                backgroundColor: "#E8F5E9",
                color: "#00A651",
                borderRadius: "4px",
                fontSize: "clamp(0.75rem, 1.8vw, 0.85rem)",
                fontWeight: "600"
              }}>
                Veröffentlicht
              </span>
            </div>
            <div style={{
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Veröffentlicht am: {formatDate(createdAt)}
            </div>
            <div style={{
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              color: "#7A7A7A"
            }}>
              Bearbeiter: {createdBy}
            </div>
          </div>
          <div style={{
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            color: "#E20074"
          }}>
            Anzeigen →
          </div>
        </div>
      </Link>
      {hasQrCode && (
        <div style={{
          position: "absolute",
          top: "1rem",
          right: "1rem"
        }}>
          <a
            href={`/api/app/dpp/${dppId}/versions/${version}/qr-code`}
            download
            title="QR-Code herunterladen"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              color: "#7A7A7A",
              backgroundColor: "transparent",
              border: "1px solid #CDCDCD",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#E20074"
              e.currentTarget.style.color = "#E20074"
              e.currentTarget.style.backgroundColor = "#FFF5F9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#CDCDCD"
              e.currentTarget.style.color = "#7A7A7A"
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            <QrCodeIcon />
          </a>
        </div>
      )}
    </div>
  )
}

