"use client"

import Link from "next/link"

interface VersionCardProps {
  href: string
  version: number
  createdAt: string
  createdBy: string
  hasQrCode: boolean
  dppId: string
}

/**
 * Version-Card mit QR-Code-Icon
 */
export default function VersionCard({ href, version, createdAt, createdBy, hasQrCode, dppId }: VersionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const DownloadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )

  return (
    <div
      className="version-card-wrapper"
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
      <style>{`
        .version-card-wrapper a:hover {
          text-decoration: none;
        }
        .version-card-wrapper:hover {
          border-color: #24c598 !important;
          box-shadow: 0 2px 8px rgba(226, 0, 116, 0.1);
        }
      `}</style>
      <Link
        href={href}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block"
        }}
      >
        <div>
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
      </Link>
      {hasQrCode && (
        <div style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10
        }}>
          <button
            type="button"
            title="QR-Code herunterladen"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              const link = document.createElement('a')
              link.href = `/api/app/dpp/${dppId}/versions/${version}/qr-code`
              link.download = ''
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              color: "#7A7A7A",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CDCDCD",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#24c598"
              e.currentTarget.style.color = "#24c598"
              e.currentTarget.style.backgroundColor = "#FFF5F9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#CDCDCD"
              e.currentTarget.style.color = "#7A7A7A"
              e.currentTarget.style.backgroundColor = "#FFFFFF"
            }}
          >
            <DownloadIcon />
          </button>
        </div>
      )}
    </div>
  )
}

