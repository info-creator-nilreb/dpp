"use client"

import { useEffect, useState } from "react"

interface StickySaveBarProps {
  status: "idle" | "saving" | "saved" | "publishing" | "error"
  lastSaved: Date | null
  onSave: () => void
  onPublish: () => void
  isNew: boolean
  canPublish: boolean // z.B. wenn Pflichtfelder ausgefüllt sind
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
  error
}: StickySaveBarProps) {
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
        return "Nicht gespeichert"
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "saved":
        return "#00A651"
      case "error":
        return "#E20074"
      case "saving":
      case "publishing":
        return "#7A7A7A"
      default:
        return "#7A7A7A"
    }
  }

  const isProcessing = status === "saving" || status === "publishing"

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#FFFFFF",
      borderTop: "1px solid #CDCDCD",
      padding: "1rem clamp(1rem, 3vw, 2rem)",
      boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
      zIndex: 1000,
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
        {status === "saved" && lastSaved && timeAgo && (
          <span style={{
            fontSize: "clamp(0.75rem, 1.8vw, 0.85rem)",
            color: "#7A7A7A"
          }}>
            Zuletzt gespeichert {timeAgo}
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
      </div>

      {/* Actions Section */}
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
          disabled={isProcessing || !canPublish}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isProcessing || !canPublish ? "#CDCDCD" : "#E20074",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            fontWeight: "600",
            cursor: isProcessing || !canPublish ? "not-allowed" : "pointer",
            boxShadow: isProcessing || !canPublish ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)",
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
  )
}




