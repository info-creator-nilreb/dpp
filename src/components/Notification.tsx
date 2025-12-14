"use client"

import { useEffect } from "react"

interface NotificationProps {
  message: string
  type?: "success" | "error" | "info"
  onClose: () => void
  duration?: number
}

/**
 * Notification-Komponente
 * 
 * Zeigt dezent am oberen rechten Bildrand eine Benachrichtigung an
 */
export default function Notification({ message, type = "success", onClose, duration = 4000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const bgColor = type === "success" ? "#00A651" : type === "error" ? "#E20074" : "#007BFF"
  
  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        backgroundColor: bgColor,
        color: "#FFFFFF",
        padding: "1rem 1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 10000,
        maxWidth: "400px",
        animation: "slideIn 0.3s ease-out"
      }}
      onClick={onClose}
      role="alert"
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem"
      }}>
        <span style={{
          fontSize: "0.95rem",
          fontWeight: "500",
          lineHeight: "1.4"
        }}>
          {message}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{
            background: "none",
            border: "none",
            color: "#FFFFFF",
            fontSize: "1.25rem",
            fontWeight: "bold",
            cursor: "pointer",
            padding: "0",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.8
          }}
          aria-label="Schließen"
        >
          ×
        </button>
      </div>
    </div>
  )
}

