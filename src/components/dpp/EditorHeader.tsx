"use client"

/**
 * Global Editor Header
 * 
 * Sticky header that replaces the footer pattern.
 * - Always visible, independent of tabs
 * - Shows status, meta info, and actions
 * - No knowledge of tabs, subscriptions, or features
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type EditorStatus = "draft" | "published" | "published_with_hints" | "error"

interface EditorHeaderProps {
  status: EditorStatus
  lastSaved: Date | null
  onPublish: () => void
  isNew: boolean
  canPublish: boolean // Pflichtdaten vorhanden
  subscriptionCanPublish?: boolean
  error?: string | null
  isProcessing?: boolean // saving or publishing
  hints?: string[] // Optional hints (e.g., "Optionale Tabs leer")
  autoSaveStatus?: "idle" | "saving" | "saved" | "error" // Auto-save status
  onRetrySave?: () => void // Optional retry for failed auto-saves
}

export default function EditorHeader({
  status,
  lastSaved,
  onPublish,
  isNew,
  canPublish,
  subscriptionCanPublish = true,
  error,
  isProcessing = false,
  hints = [],
  autoSaveStatus = "idle",
  onRetrySave
}: EditorHeaderProps) {
  const router = useRouter()
  const [timeAgo, setTimeAgo] = useState<string>("")

  // Calculate "vor X Sekunden/Minuten" text
  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo("")
      return
    }

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved!.getTime()) / 1000)
      if (seconds < 60) {
        setTimeAgo(`vor ${seconds} Sekunden`)
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        setTimeAgo(`vor ${minutes} Minute${minutes !== 1 ? "n" : ""}`)
      } else {
        const hours = Math.floor(seconds / 3600)
        setTimeAgo(`vor ${hours} Stunde${hours !== 1 ? "n" : ""}`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)
    return () => clearInterval(interval)
  }, [lastSaved])

  const getStatusText = (): string => {
    // Show auto-save status if available
    if (autoSaveStatus === "saving") {
      return "Wird gespeichert..."
    }
    if (autoSaveStatus === "saved") {
      return "Gespeichert"
    }
    if (autoSaveStatus === "error") {
      return "Speichern fehlgeschlagen"
    }
    
    switch (status) {
      case "draft":
        return "Entwurf"
      case "published":
        return "Veröffentlicht"
      case "published_with_hints":
        return "Veröffentlicht (mit Hinweisen)"
      case "error":
        return "Fehler"
      default:
        return lastSaved ? "Zuletzt gespeichert:" : "Nicht gespeichert"
    }
  }

  const getStatusColor = (): string => {
    // Auto-save status takes precedence
    if (autoSaveStatus === "saving") {
      return "#7A7A7A"
    }
    if (autoSaveStatus === "saved") {
      return "#00A651"
    }
    if (autoSaveStatus === "error") {
      return "#E20074"
    }
    
    switch (status) {
      case "published":
      case "published_with_hints":
        return "#00A651"
      case "error":
        return "#E20074"
      case "draft":
      default:
        return lastSaved ? "#00A651" : "#7A7A7A"
    }
  }

  const publishDisabled = isProcessing || !canPublish || !subscriptionCanPublish

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .editor-header {
              left: 0 !important;
            }
          }
          @media (min-width: 768px) {
            .editor-header {
              left: var(--sidebar-width, 280px) !important;
              transition: left 0.3s ease;
            }
          }
        `
      }} />
      <div 
        className="editor-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #CDCDCD",
          padding: "1rem clamp(1rem, 3vw, 2rem)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}
      >
        {/* Main Content Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          {/* Status Section */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            flex: 1,
            minWidth: "200px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span style={{
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "600",
                color: getStatusColor()
              }}>
                {getStatusText()}
              </span>
            </div>
            {((status === "draft" || status === "published_with_hints") && lastSaved && timeAgo) && (
              <span style={{
                fontSize: "clamp(0.75rem, 1.8vw, 0.85rem)",
                color: "#7A7A7A"
              }}>
                {lastSaved.toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })} ({timeAgo})
              </span>
            )}
            {status === "error" && error && (
              <span style={{
                fontSize: "clamp(0.75rem, 1.8vw, 0.85rem)",
                color: "#E20074"
              }}>
                {error}
              </span>
            )}
            {hints.length > 0 && (
              <div style={{
                fontSize: "clamp(0.75rem, 1.8vw, 0.85rem)",
                color: "#B8860B"
              }}>
                {hints.map((hint, idx) => (
                  <span key={idx}>{hint}{idx < hints.length - 1 ? " • " : ""}</span>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center"
          }}>
            {/* Retry Save Button - only shown if auto-save failed */}
            {autoSaveStatus === "error" && onRetrySave && (
              <button
                onClick={onRetrySave}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "transparent",
                  color: "#E20074",
                  border: "1px solid #E20074",
                  borderRadius: "8px",
                  fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFF5F9"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
              >
                Erneut speichern
              </button>
            )}
            {/* Publish Button - primary action */}
            <button
              onClick={onPublish}
              disabled={publishDisabled || isProcessing}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: publishDisabled || isProcessing ? "#CDCDCD" : "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "600",
                cursor: publishDisabled || isProcessing ? "not-allowed" : "pointer",
                boxShadow: publishDisabled || isProcessing ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)",
                transition: "all 0.2s"
              }}
            >
              {isProcessing
                ? "Wird veröffentlicht..."
                : (isNew ? "Veröffentlichen" : "Neue Version veröffentlichen")
              }
            </button>
          </div>
        </div>

        {/* Trial Explanation (shown when subscription doesn't allow publishing) */}
        {!subscriptionCanPublish && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#F5F5F5",
            borderRadius: "6px",
            fontSize: "clamp(0.8rem, 1.8vw, 0.9rem)",
            color: "#0A0A0A"
          }}>
            <span style={{ flex: 1 }}>
              Veröffentlichung von Produktpässen ist in der Testphase nicht verfügbar. Upgrade erforderlich.
            </span>
            <button
              onClick={() => router.push("/app/organization")}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "#E20074",
                border: "1px solid #E20074",
                borderRadius: "6px",
                fontSize: "clamp(0.8rem, 1.8vw, 0.9rem)",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#E20074"
                e.currentTarget.style.color = "#FFFFFF"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
                e.currentTarget.style.color = "#E20074"
              }}
            >
              Jetzt upgraden →
            </button>
          </div>
        )}
      </div>
      {/* Spacer to prevent content from being hidden under header */}
      {/* Height is dynamic based on content (status + optional trial banner) */}
      <div style={{ height: "100px", minHeight: "100px" }} />
    </>
  )
}

