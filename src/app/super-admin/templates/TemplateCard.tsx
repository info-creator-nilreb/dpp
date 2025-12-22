"use client"

import Link from "next/link"

interface TemplateCardProps {
  id: string
  name: string
  description: string | null
  status: string
  version: number
  blockCount: number
  updatedAt: Date
}

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  archived: "Archiviert"
}

const statusColors: Record<string, string> = {
  draft: "#7A7A7A",
  active: "#00A651",
  archived: "#DC2626"
}

export default function TemplateCard({
  id,
  name,
  description,
  status,
  version,
  blockCount,
  updatedAt
}: TemplateCardProps) {
  return (
    <Link
      href={`/super-admin/templates/${id}`}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "1.5rem",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
        e.currentTarget.style.borderColor = "#E20074"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.borderColor = "#E5E5E5"
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1rem"
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            {name}
          </h3>
          {description && (
            <p style={{
              fontSize: "0.9rem",
              color: "#7A7A7A",
              marginBottom: "0.5rem"
            }}>
              {description}
            </p>
          )}
          <div style={{
            display: "flex",
            gap: "1rem",
            fontSize: "0.875rem",
            color: "#7A7A7A"
          }}>
            <span>Version {version}</span>
            <span>•</span>
            <span>{blockCount} Block{blockCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div style={{
          padding: "0.25rem 0.75rem",
          borderRadius: "12px",
          backgroundColor: statusColors[status] + "15",
          color: statusColors[status],
          fontSize: "0.75rem",
          fontWeight: "600",
          whiteSpace: "nowrap"
        }}>
          {statusLabels[status] || status}
        </div>
      </div>
      <div style={{
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #E5E5E5",
        fontSize: "0.875rem",
        color: "#7A7A7A"
      }}>
        Zuletzt aktualisiert: {new Date(updatedAt).toLocaleDateString("de-DE")}
      </div>
    </Link>
  )
}

