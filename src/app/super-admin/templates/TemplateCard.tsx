"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotification } from "@/components/NotificationProvider"
import ConfirmDialog from "@/components/ConfirmDialog"

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
  const router = useRouter()
  const { showNotification } = useNotification()
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowArchiveDialog(true)
  }

  const confirmArchive = async () => {
    setArchiving(true)
    try {
      const response = await fetch(`/api/super-admin/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "archived"
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Archivieren")
      }

      showNotification("Template erfolgreich archiviert", "success")
      setShowArchiveDialog(false)
      router.refresh()
    } catch (err: any) {
      showNotification(err.message || "Fehler beim Archivieren", "error")
    } finally {
      setArchiving(false)
    }
  }

  return (
    <>
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "1.5rem",
        position: "relative",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
        e.currentTarget.style.borderColor = "#24c598"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.borderColor = "#E5E5E5"
      }}
    >
      <Link
        href={`/super-admin/templates/${id}`}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block"
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
      </Link>
      <div style={{
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #E5E5E5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{
          fontSize: "0.875rem",
          color: "#7A7A7A"
        }}>
          Zuletzt aktualisiert: {new Date(updatedAt).toLocaleDateString("de-DE")}
        </div>
        {status === "active" && (
          <button
            onClick={handleArchive}
            disabled={archiving}
            title="Template archivieren"
            style={{
              padding: "0.5rem",
              backgroundColor: "transparent",
              border: "none",
              cursor: archiving ? "not-allowed" : "pointer",
              opacity: archiving ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7A7A7A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
    
    {/* Archive Confirmation Dialog */}
    <ConfirmDialog
      isOpen={showArchiveDialog}
      title="Template archivieren"
      message="Möchten Sie dieses Template wirklich archivieren? Es wird nicht mehr für neue DPPs verfügbar sein."
      confirmLabel="Archivieren"
      cancelLabel="Abbrechen"
      onConfirm={confirmArchive}
      onCancel={() => setShowArchiveDialog(false)}
    />
    </>
  )
}

