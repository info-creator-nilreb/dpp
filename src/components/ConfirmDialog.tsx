"use client"

import { useEffect } from "react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: "default" | "danger"
}

/**
 * ConfirmDialog Komponente
 * 
 * State-of-the-art Bestätigungsdialog mit modernem Design
 * ESC-Taste schließt den Dialog, Backdrop-Klick ebenfalls
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  onConfirm,
  onCancel,
  variant = "default"
}: ConfirmDialogProps) {
  // ESC-Taste zum Schließen
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
      }
    }

    document.addEventListener("keydown", handleEscape)
    // Body scroll sperren wenn Dialog offen ist
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const confirmButtonColor = variant === "danger" ? "#24c598" : "#24c598"
  const confirmButtonHover = variant === "danger" ? "#C20062" : "#C20062"

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
          animation: "fadeIn 0.2s ease-out"
        }}
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          zIndex: 9999,
          width: "90%",
          maxWidth: "480px",
          animation: "slideUp 0.2s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: "1.5rem 1.5rem 1rem",
          borderBottom: "1px solid #F5F5F5"
        }}>
          <h2
            id="dialog-title"
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "#0A0A0A",
              margin: 0
            }}
          >
            {title}
          </h2>
        </div>

        {/* Body */}
        <div style={{
          padding: "1.5rem"
        }}>
          <p
            id="dialog-message"
            style={{
              fontSize: "1rem",
              color: "#7A7A7A",
              lineHeight: "1.5",
              margin: 0,
              marginBottom: "1.5rem"
            }}
          >
            {message}
          </p>

          {/* Actions */}
          <div style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end"
          }}>
            <button
              onClick={onCancel}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                color: "#7A7A7A",
                backgroundColor: "transparent",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                minWidth: "120px",
                boxSizing: "border-box"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#24c598"
                e.currentTarget.style.color = "#24c598"
                e.currentTarget.style.backgroundColor = "#FFF5F9"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#CDCDCD"
                e.currentTarget.style.color = "#7A7A7A"
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#FFFFFF",
                backgroundColor: confirmButtonColor,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(226, 0, 116, 0.2)",
                minWidth: "120px",
                boxSizing: "border-box"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = confirmButtonHover
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(226, 0, 116, 0.3)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = confirmButtonColor
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(226, 0, 116, 0.2)"
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

