"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useNotification } from "@/components/NotificationProvider"

interface DppCardProps {
  id: string
  name: string
  description: string | null
  organizationName: string
  mediaCount: number
  status?: string
  updatedAt?: Date
  latestVersion?: {
    version: number
    createdAt: string
    createdBy: string
    hasQrCode?: boolean
  } | null
}

/**
 * DPP-Karte Komponente
 * 
 * Client Component für die DPP-Karte mit Aktions-Icons
 */
export default function DppCard({ id, name, description, organizationName, mediaCount, status, updatedAt, latestVersion }: DppCardProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [publishing, setPublishing] = useState(false)

  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const statusLabel = status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"
  const statusColor = status === "PUBLISHED" ? "#00A651" : "#7A7A7A"

  const handlePublish = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm("Möchten Sie diesen Produktpass als neue Version veröffentlichen?")) {
      return
    }

    setPublishing(true)
    try {
      const response = await fetch(`/api/app/dpp/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        const data = await response.json()
        showNotification(`Produktpass erfolgreich als Version ${data.version.version} veröffentlicht!`, "success")
        // Reload die Seite, damit die aktualisierte Liste angezeigt wird
        window.location.reload()
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || "Fehler beim Veröffentlichen", "error")
      }
    } catch (error) {
      showNotification("Ein Fehler ist aufgetreten", "error")
    } finally {
      setPublishing(false)
    }
  }

  // Icon SVG-Komponenten
  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const EditIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )

  const PublishIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )

  const VersionsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  )

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
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        transition: "border-color 0.2s, box-shadow 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#E20074"
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(226, 0, 116, 0.1)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#CDCDCD"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Header mit Name */}
      <Link
        href={`/app/dpps/${id}`}
        style={{
          textDecoration: "none",
          color: "inherit"
        }}
      >
        <div style={{
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {name}
        </div>
        {description && (
          <div style={{
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            color: "#7A7A7A",
            marginBottom: "0.5rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
          }}>
            {description}
          </div>
        )}
      </Link>

      {/* Status & Version Info */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
        color: "#7A7A7A",
        marginBottom: "0.5rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid #F5F5F5"
      }}>
        <span style={{ color: statusColor, fontWeight: "500" }}>
          {statusLabel}
          {latestVersion && ` • v${latestVersion.version}`}
        </span>
        {updatedAt && (
          <span>
            {formatDate(updatedAt)}
          </span>
        )}
      </div>

      {/* Version Details (falls vorhanden) */}
      {latestVersion && (
        <div style={{
          fontSize: "clamp(0.7rem, 1.8vw, 0.75rem)",
          color: "#7A7A7A",
          marginBottom: "0.75rem"
        }}>
          Letzte Version: {new Date(latestVersion.createdAt).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })} von {latestVersion.createdBy}
        </div>
      )}

      {/* Meta Info */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
        color: "#7A7A7A",
        marginBottom: "0.75rem"
      }}>
        <span>{organizationName}</span>
        <span>{mediaCount} Medien</span>
      </div>

      {/* Aktions-Icons */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        justifyContent: "flex-end",
        paddingTop: "0.75rem",
        borderTop: "1px solid #F5F5F5"
      }}>
        {/* Vorschau (letzte Version) */}
        {latestVersion && (
          <Link
            href={`/app/dpps/${id}/versions/${latestVersion.version}`}
            title="Vorschau (letzte Version)"
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
            <EyeIcon />
          </Link>
        )}

        {/* Bearbeiten */}
        <Link
          href={`/app/dpps/${id}`}
          title="Bearbeiten (Draft)"
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
          <EditIcon />
        </Link>

        {/* Veröffentlichen */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          title="Neue Version veröffentlichen"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            color: publishing ? "#CDCDCD" : "#7A7A7A",
            backgroundColor: "transparent",
            border: "1px solid #CDCDCD",
            cursor: publishing ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (!publishing) {
              e.currentTarget.style.borderColor = "#E20074"
              e.currentTarget.style.color = "#E20074"
              e.currentTarget.style.backgroundColor = "#FFF5F9"
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#CDCDCD"
            e.currentTarget.style.color = "#7A7A7A"
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          <PublishIcon />
        </button>

        {/* Versionen anzeigen */}
        <Link
          href={`/app/dpps/${id}/versions`}
          title="Versionen anzeigen"
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
          <VersionsIcon />
        </Link>
      </div>
    </div>
  )
}
