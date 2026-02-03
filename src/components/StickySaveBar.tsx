"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface StickySaveBarProps {
  status: "idle" | "saving" | "saved" | "publishing" | "error"
  lastSaved: Date | null
  onSave: () => void
  onPublish: () => void
  isNew: boolean
  canPublish: boolean // z.B. wenn Pflichtfelder ausgefüllt sind
  subscriptionCanPublish?: boolean // Server-side subscription context: canPublish from subscription
  error?: string | null
}

/**
 * Sticky Save Bar für DPP Editor
 * 
 * Immer sichtbare Save-Bar am unteren Rand des Editors
 * Zeigt Status, letztes Speicherdatum und Aktions-Buttons
 */
export default function StickySaveBar({
  status,
  lastSaved,
  onSave,
  onPublish,
  isNew,
  canPublish,
  subscriptionCanPublish = true, // Default to true if not provided (backwards compatibility)
  error
}: StickySaveBarProps) {
  const router = useRouter()
  const [timeAgo, setTimeAgo] = useState<string>("")

  // Berechne "vor X Sekunden/Minuten" Text
  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo("")
      return
    }

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
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

  const getStatusText = () => {
    switch (status) {
      case "saving":
        return "Wird gespeichert..."
      case "saved":
        return "Entwurf gespeichert"
      case "publishing":
        return "Wird veröffentlicht..."
      case "error":
        return "Fehler beim Speichern"
      default:
        // Wenn lastSaved vorhanden ist, zeige "Zuletzt gespeichert:" statt "Nicht gespeichert"
        return lastSaved ? "Zuletzt gespeichert:" : "Nicht gespeichert"
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "saved":
        return "#00A651"
      case "error":
        return "#F87171"
      case "saving":
      case "publishing":
        return "#7A7A7A"
      default:
        // Wenn lastSaved vorhanden ist, zeige grün (wie bei "saved")
        return lastSaved ? "#00A651" : "#7A7A7A"
    }
  }

  const isProcessing = status === "saving" || status === "publishing"
  
  // Publishing is disabled if subscription doesn't allow it OR if form validation fails
  const publishDisabled = isProcessing || !canPublish || !subscriptionCanPublish

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .sticky-save-bar {
              left: 0 !important;
              z-index: 27 !important;
              padding-top: 56px !important;
            }
          }
          @media (min-width: 768px) {
            .sticky-save-bar {
              left: var(--sidebar-width, 280px) !important;
              width: calc(100vw - var(--sidebar-width, 280px)) !important;
              transition: left 0.3s ease, width 0.3s ease;
            }
          }
        `
      }} />
      <div 
        className="sticky-save-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #CDCDCD",
          padding: "1rem clamp(1rem, 3vw, 2rem)",
          boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          boxSizing: "border-box"
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
          {((status === "saved" || (status === "idle" && lastSaved)) && lastSaved && timeAgo) && (
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
              color: "#F87171"
            }}>
              {error}
            </span>
          )}
        </div>

        {/* Actions Section */}
        <div style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center"
        }}>
          <div style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center"
          }}>
            <button
              onClick={onSave}
              disabled={isProcessing}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: isProcessing ? "#CDCDCD" : "transparent",
                color: isProcessing ? "#FFFFFF" : "#0A0A0A",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "600",
                cursor: isProcessing ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {status === "saving" 
                ? (isNew ? "Wird erstellt..." : "Wird gespeichert...")
                : (isNew ? "Als Entwurf speichern" : "Änderungen speichern")
              }
            </button>
            <button
              onClick={onPublish}
              disabled={publishDisabled}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: publishDisabled ? "#CDCDCD" : "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "600",
                cursor: publishDisabled ? "not-allowed" : "pointer",
                boxShadow: publishDisabled ? "none" : "0 4px 12px rgba(36, 197, 152, 0.3)",
                transition: "all 0.2s"
              }}
            >
              {status === "publishing"
                ? "Wird veröffentlicht..."
                : (isNew ? "Veröffentlichen" : "Neue Version veröffentlichen")
              }
            </button>
          </div>
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
              color: "#24c598",
              border: "1px solid #24c598",
              borderRadius: "6px",
              fontSize: "clamp(0.8rem, 1.8vw, 0.9rem)",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#24c598"
              e.currentTarget.style.color = "#FFFFFF"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "#24c598"
            }}
          >
            Jetzt upgraden →
          </button>
        </div>
      )}
      </div>
    </>
  )
}




